/**
 * ChromaDB Vector Store
 * Full vector database implementation with ChromaDB
 */

const EventEmitter = require('events');
const { ChromaClient } = require('chromadb');

class ChromaStore extends EventEmitter {
    constructor() {
        super();
        this.client = null;
        this.collections = new Map();
        this.isInitialized = false;
        this.defaultCollectionName = 'default';
        this.embeddingModel = 'openai'; // openai, cohere, huggingface
        this.embeddingDimension = 1536; // OpenAI ada-002 dimension
    }

    /**
     * Initialize ChromaDB client
     */
    async initialize(options = {}) {
        try {
            console.log('[ChromaDB] Initializing...');

            // Create ChromaDB client
            const chromaUrl = options.chromaUrl || process.env.CHROMA_URL || 'http://localhost:8000';
            this.client = new ChromaClient({
                path: chromaUrl
            });

            // Test connection
            await this.client.heartbeat();

            // Get or create default collection
            await this.getOrCreateCollection(this.defaultCollectionName);

            this.isInitialized = true;

            this.emit('initialized');
            console.log('[ChromaDB] Initialized successfully');

            return { success: true, url: chromaUrl };
        } catch (error) {
            console.error('[ChromaDB] Initialization error:', error);
            this.emit('error', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get or create collection
     */
    async getOrCreateCollection(collectionName, options = {}) {
        try {
            // Check if collection exists
            const existingCollection = this.collections.get(collectionName);
            if (existingCollection) {
                return existingCollection;
            }

            // Create collection
            const collection = await this.client.getOrCreateCollection({
                name: collectionName,
                metadata: options.metadata || {},
                embeddingFunction: options.embeddingFunction
            });

            this.collections.set(collectionName, collection);

            this.emit('collection-created', { name: collectionName });
            console.log(`[ChromaDB] Collection created: ${collectionName}`);

            return collection;
        } catch (error) {
            console.error('[ChromaDB] Collection creation error:', error);
            throw error;
        }
    }

    /**
     * Add documents to collection
     */
    async addDocuments(collectionName, documents, options = {}) {
        try {
            const collection = await this.getOrCreateCollection(collectionName);

            // Generate embeddings if not provided
            const embeddings = options.embeddings || await this.generateEmbeddings(
                documents.map(d => d.content || d.text || d)
            );

            // Prepare documents
            const ids = documents.map((d, i) => d.id || `doc_${Date.now()}_${i}`);
            const metadatas = documents.map(d => d.metadata || {});
            const contents = documents.map(d => d.content || d.text || d);

            // Add documents
            await collection.add({
                ids,
                embeddings,
                metadatas,
                documents: contents
            });

            this.emit('documents-added', { collectionName, count: documents.length });

            return { success: true, count: documents.length, ids };
        } catch (error) {
            console.error('[ChromaDB] Add documents error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Query collection
     */
    async queryCollection(collectionName, queryText, options = {}) {
        try {
            const collection = await this.getOrCreateCollection(collectionName);

            // Generate query embedding
            const queryEmbedding = options.queryEmbedding ||
                (await this.generateEmbeddings([queryText]))[0];

            // Query collection
            const results = await collection.query({
                queryEmbeddings: [queryEmbedding],
                nResults: options.nResults || 10,
                where: options.where,
                whereDocument: options.whereDocument
            });

            const documents = results.documents[0] || [];
            const metadatas = results.metadatas[0] || [];
            const distances = results.distances[0] || [];

            // Format results
            const formattedResults = documents.map((doc, i) => ({
                content: doc,
                metadata: metadatas[i] || {},
                distance: distances[i] || 0,
                similarity: 1 - (distances[i] || 0)
            }));

            this.emit('query-executed', { collectionName, count: formattedResults.length });

            return { success: true, results: formattedResults };
        } catch (error) {
            console.error('[ChromaDB] Query error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate embeddings
     */
    async generateEmbeddings(texts) {
        try {
            switch (this.embeddingModel) {
                case 'openai':
                    return await this.generateOpenAIEmbeddings(texts);
                case 'cohere':
                    return await this.generateCohereEmbeddings(texts);
                case 'huggingface':
                    return await this.generateHuggingFaceEmbeddings(texts);
                default:
                    throw new Error(`Unknown embedding model: ${this.embeddingModel}`);
            }
        } catch (error) {
            console.error('[ChromaDB] Embedding generation error:', error);
            throw error;
        }
    }

    /**
     * Generate OpenAI embeddings
     */
    async generateOpenAIEmbeddings(texts) {
        const openai = require('openai');
        const client = new openai.OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        const response = await client.embeddings.create({
            model: 'text-embedding-ada-002',
            input: texts
        });

        return response.data.map(d => d.embedding);
    }

    /**
     * Generate Cohere embeddings
     */
    async generateCohereEmbeddings(texts) {
        const cohere = require('cohere-ai');
        const client = new cohere.CohereClient({
            apiKey: process.env.COHERE_API_KEY
        });

        const response = await client.embed({
            texts: texts,
            model: 'embed-english-v2.0'
        });

        return response.embeddings;
    }

    /**
     * Generate HuggingFace embeddings
     */
    async generateHuggingFaceEmbeddings(texts) {
        const { HfInference } = require('@huggingface/inference');
        const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

        const embeddings = [];
        for (const text of texts) {
            const result = await hf.featureExtraction({
                model: 'sentence-transformers/all-MiniLM-L6-v2',
                inputs: text
            });
            embeddings.push(result);
        }

        return embeddings;
    }

    /**
     * Delete documents from collection
     */
    async deleteDocuments(collectionName, ids) {
        try {
            const collection = await this.getOrCreateCollection(collectionName);

            await collection.delete({
                ids
            });

            this.emit('documents-deleted', { collectionName, count: ids.length });

            return { success: true, count: ids.length };
        } catch (error) {
            console.error('[ChromaDB] Delete documents error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update documents in collection
     */
    async updateDocuments(collectionName, documents) {
        try {
            const collection = await this.getOrCreateCollection(collectionName);

            // Generate embeddings
            const embeddings = await this.generateEmbeddings(
                documents.map(d => d.content || d.text || d)
            );

            // Update documents
            await collection.update({
                ids: documents.map(d => d.id),
                embeddings,
                metadatas: documents.map(d => d.metadata || {})
            });

            this.emit('documents-updated', { collectionName, count: documents.length });

            return { success: true, count: documents.length };
        } catch (error) {
            console.error('[ChromaDB] Update documents error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get collection count
     */
    async getCollectionCount(collectionName) {
        try {
            const collection = await this.getOrCreateCollection(collectionName);
            const count = await collection.count();

            return { success: true, count };
        } catch (error) {
            console.error('[ChromaDB] Get count error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all collections
     */
    async getAllCollections() {
        try {
            const collections = await this.client.listCollections();

            return { success: true, collections };
        } catch (error) {
            console.error('[ChromaDB] List collections error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete collection
     */
    async deleteCollection(collectionName) {
        try {
            await this.client.deleteCollection({ name: collectionName });

            this.collections.delete(collectionName);

            this.emit('collection-deleted', { name: collectionName });
            console.log(`[ChromaDB] Collection deleted: ${collectionName}`);

            return { success: true };
        } catch (error) {
            console.error('[ChromaDB] Delete collection error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Semantic search
     */
    async semanticSearch(query, options = {}) {
        try {
            const collectionName = options.collectionName || this.defaultCollectionName;

            return await this.queryCollection(collectionName, query, options);
        } catch (error) {
            console.error('[ChromaDB] Semantic search error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Hybrid search (keyword + semantic)
     */
    async hybridSearch(query, options = {}) {
        try {
            const collectionName = options.collectionName || this.defaultCollectionName;
            const collection = await this.getOrCreateCollection(collectionName);

            // Generate query embedding
            const queryEmbedding = (await this.generateEmbeddings([query]))[0];

            // Hybrid query
            const results = await collection.query({
                queryEmbeddings: [queryEmbedding],
                nResults: options.nResults || 10,
                where: options.where
            });

            // Filter by keyword match
            const documents = results.documents[0] || [];
            const metadatas = results.metadatas[0] || [];
            const distances = results.distances[0] || [];

            const keywordMatches = documents.filter(doc =>
                doc.toLowerCase().includes(query.toLowerCase())
            );

            const formattedResults = documents.map((doc, i) => ({
                content: doc,
                metadata: metadatas[i] || {},
                distance: distances[i] || 0,
                similarity: 1 - (distances[i] || 0),
                keywordMatch: keywordMatches.includes(doc)
            }));

            // Sort by combined score
            formattedResults.sort((a, b) => {
                const scoreA = a.similarity * 0.7 + (a.keywordMatch ? 0.3 : 0);
                const scoreB = b.similarity * 0.7 + (b.keywordMatch ? 0.3 : 0);
                return scoreB - scoreA;
            });

            return { success: true, results: formattedResults };
        } catch (error) {
            console.error('[ChromaDB] Hybrid search error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Set embedding model
     */
    setEmbeddingModel(model) {
        this.embeddingModel = model;
        this.emit('embedding-model-changed', model);
        console.log(`[ChromaDB] Embedding model changed to: ${model}`);
    }

    /**
     * Get embedding model
     */
    getEmbeddingModel() {
        return this.embeddingModel;
    }

    /**
     * Batch operations
     */
    async batchAdd(collectionName, documents, batchSize = 100) {
        try {
            const results = [];

            for (let i = 0; i < documents.length; i += batchSize) {
                const batch = documents.slice(i, i + batchSize);
                const result = await this.addDocuments(collectionName, batch);
                results.push(result);
            }

            return { success: true, results };
        } catch (error) {
            console.error('[ChromaDB] Batch add error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get statistics
     */
    async getStatistics() {
        try {
            const collections = await this.getAllCollections();
            const stats = {
                totalCollections: collections.collections.length,
                collections: []
            };

            for (const collection of collections.collections) {
                const count = await this.getCollectionCount(collection.name);
                stats.collections.push({
                    name: collection.name,
                    count: count.count,
                    metadata: collection.metadata
                });
            }

            return { success: true, statistics: stats };
        } catch (error) {
            console.error('[ChromaDB] Get statistics error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Reset collection
     */
    async resetCollection(collectionName) {
        try {
            // Delete and recreate collection
            await this.deleteCollection(collectionName);
            await this.getOrCreateCollection(collectionName);

            this.emit('collection-reset', { name: collectionName });
            console.log(`[ChromaDB] Collection reset: ${collectionName}`);

            return { success: true };
        } catch (error) {
            console.error('[ChromaDB] Reset collection error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Export collection
     */
    async exportCollection(collectionName) {
        try {
            const collection = await this.getOrCreateCollection(collectionName);

            // Get all documents
            const results = await collection.get({
                limit: 10000,
                offset: 0,
                include: ['documents', 'metadatas', 'embeddings']
            });

            const exportData = {
                collectionName,
                exportedAt: new Date().toISOString(),
                count: results.documents.length,
                documents: results.documents.map((doc, i) => ({
                    content: doc,
                    metadata: results.metadatas[i],
                    embedding: results.embeddings[i]
                }))
            };

            return { success: true, data: exportData };
        } catch (error) {
            console.error('[ChromaDB] Export collection error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Import collection
     */
    async importCollection(collectionName, data) {
        try {
            const documents = data.documents.map(d => ({
                content: d.content,
                metadata: d.metadata,
                embedding: d.embedding
            }));

            await this.addDocuments(collectionName, documents, {
                embeddings: documents.map(d => d.embedding)
            });

            this.emit('collection-imported', { name: collectionName, count: documents.length });

            return { success: true, count: documents.length };
        } catch (error) {
            console.error('[ChromaDB] Import collection error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            collections: this.collections.size,
            embeddingModel: this.embeddingModel,
            embeddingDimension: this.embeddingDimension
        };
    }

    /**
     * Close connection
     */
    async close() {
        try {
            if (this.client) {
                // ChromaDB client doesn't have explicit close method
                this.client = null;
                this.isInitialized = false;
                this.collections.clear();

                this.emit('closed');
                console.log('[ChromaDB] Connection closed');
            }

            return { success: true };
        } catch (error) {
            console.error('[ChromaDB] Close error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new ChromaStore();
