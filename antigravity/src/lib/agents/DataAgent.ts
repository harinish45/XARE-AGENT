// Data Agent - Handles data analysis, transformation, and visualization
// Analyzes datasets, runs queries, creates visualizations, and exports data

import { ParsedIntent } from './IntentParser';
import { Agent, AgentResult } from './AgentRouter';

export interface Dataset {
    id: string;
    name: string;
    rows: Record<string, any>[];
    columns: ColumnDefinition[];
    size: number;
    createdAt: Date;
    source: string;
}

export interface ColumnDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'object';
    nullable: boolean;
    unique: number;
    sample: any[];
}

export interface AnalysisResult {
    summary: DataSummary;
    statistics: Statistics;
    correlations: Correlation[];
    insights: string[];
    visualizations: Visualization[];
}

export interface DataSummary {
    rowCount: number;
    columnCount: number;
    missingValues: Record<string, number>;
    duplicates: number;
    types: Record<string, string>;
}

export interface Statistics {
    numeric: Record<string, NumericStats>;
    categorical: Record<string, CategoricalStats>;
    temporal: Record<string, TemporalStats>;
}

export interface NumericStats {
    min: number;
    max: number;
    mean: number;
    median: number;
    mode: number;
    stdDev: number;
    variance: number;
    quartiles: [number, number, number];
}

export interface CategoricalStats {
    unique: number;
    top: { value: string; count: number }[];
    frequency: Record<string, number>;
}

export interface TemporalStats {
    min: Date;
    max: Date;
    range: number; // days
    gaps: number;
}

export interface Correlation {
    column1: string;
    column2: string;
    coefficient: number;
    strength: 'strong' | 'moderate' | 'weak' | 'none';
}

export interface Visualization {
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' | 'heatmap';
    title: string;
    data: any;
    config: Record<string, any>;
}

export interface QueryResult {
    rows: Record<string, any>[];
    rowCount: number;
    executionTime: number;
    columns: string[];
}

export interface TransformOperation {
    type: 'filter' | 'sort' | 'group' | 'aggregate' | 'join' | 'pivot' | 'melt';
    config: Record<string, any>;
}

export interface DataAgentConfig {
    maxRows: number;
    defaultChartType: string;
    exportFormats: string[];
    cacheEnabled: boolean;
}

export class DataAgent {
    private config: DataAgentConfig;
    private datasets: Map<string, Dataset> = new Map();
    private cache: Map<string, any> = new Map();

    constructor(config?: Partial<DataAgentConfig>) {
        this.config = {
            maxRows: config?.maxRows || 1000000,
            defaultChartType: config?.defaultChartType || 'bar',
            exportFormats: config?.exportFormats || ['csv', 'json', 'xlsx'],
            cacheEnabled: config?.cacheEnabled ?? true,
            ...config,
        };
    }

    // Main execution method
    async execute(intent: ParsedIntent, agent: Agent): Promise<AgentResult> {
        const startTime = Date.now();

        try {
            let result: any;

            switch (intent.primaryIntent) {
                case 'analyze_data':
                    result = await this.analyzeData(intent.parameters);
                    break;
                case 'query_database':
                    result = await this.queryDatabase(intent.parameters);
                    break;
                default:
                    result = await this.handleGeneralDataTask(intent);
            }

            return {
                success: true,
                agentId: agent.id,
                action: intent.action,
                output: result,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            return {
                success: false,
                agentId: agent.id,
                action: intent.action,
                output: null,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime,
            };
        }
    }

    // Load dataset
    async loadDataset(source: string, options?: {
        format?: 'csv' | 'json' | 'xlsx' | 'parquet';
        delimiter?: string;
        header?: boolean;
    }): Promise<Dataset> {
        const id = `dataset_${Date.now()}`;

        // In real implementation, this would parse the actual file
        const rows: Record<string, any>[] = [];
        const columns: ColumnDefinition[] = [];

        const dataset: Dataset = {
            id,
            name: source.split('/').pop() || 'dataset',
            rows,
            columns,
            size: 0,
            createdAt: new Date(),
            source,
        };

        this.datasets.set(id, dataset);
        return dataset;
    }

    // Analyze data
    async analyzeData(params: Record<string, any>): Promise<AnalysisResult> {
        const { dataset: datasetId, analysisType = 'full' } = params;

        const dataset = datasetId
            ? this.datasets.get(datasetId)
            : Array.from(this.datasets.values())[0];

        if (!dataset) {
            throw new Error('No dataset available for analysis');
        }

        // Generate summary
        const summary = this.generateSummary(dataset);

        // Calculate statistics
        const statistics = this.calculateStatistics(dataset);

        // Find correlations
        const correlations = this.findCorrelations(dataset);

        // Generate insights
        const insights = this.generateInsights(dataset, statistics, correlations);

        // Create visualizations
        const visualizations = this.createVisualizations(dataset, analysisType);

        return {
            summary,
            statistics,
            correlations,
            insights,
            visualizations,
        };
    }

    // Query database
    async queryDatabase(params: Record<string, any>): Promise<QueryResult> {
        const { query, database } = params;
        const startTime = Date.now();

        // In real implementation, this would execute the actual query
        const rows: Record<string, any>[] = [];

        return {
            rows,
            rowCount: rows.length,
            executionTime: Date.now() - startTime,
            columns: [],
        };
    }

    // Transform data
    async transformData(datasetId: string, operations: TransformOperation[]): Promise<Dataset> {
        const dataset = this.datasets.get(datasetId);
        if (!dataset) {
            throw new Error(`Dataset not found: ${datasetId}`);
        }

        let rows = [...dataset.rows];

        for (const op of operations) {
            switch (op.type) {
                case 'filter':
                    rows = this.applyFilter(rows, op.config);
                    break;
                case 'sort':
                    rows = this.applySort(rows, op.config);
                    break;
                case 'group':
                    rows = this.applyGroup(rows, op.config);
                    break;
                case 'aggregate':
                    rows = this.applyAggregate(rows, op.config);
                    break;
                case 'pivot':
                    rows = this.applyPivot(rows, op.config);
                    break;
            }
        }

        const transformedDataset: Dataset = {
            ...dataset,
            id: `dataset_${Date.now()}`,
            rows,
            size: rows.length,
        };

        this.datasets.set(transformedDataset.id, transformedDataset);
        return transformedDataset;
    }

    // Export data
    async exportData(datasetId: string, format: string): Promise<{
        data: string | Buffer;
        filename: string;
        mimeType: string;
    }> {
        const dataset = this.datasets.get(datasetId);
        if (!dataset) {
            throw new Error(`Dataset not found: ${datasetId}`);
        }

        switch (format.toLowerCase()) {
            case 'csv':
                return {
                    data: this.toCSV(dataset.rows),
                    filename: `${dataset.name}.csv`,
                    mimeType: 'text/csv',
                };
            case 'json':
                return {
                    data: JSON.stringify(dataset.rows, null, 2),
                    filename: `${dataset.name}.json`,
                    mimeType: 'application/json',
                };
            case 'xlsx':
                return {
                    data: Buffer.from(''), // Would use xlsx library
                    filename: `${dataset.name}.xlsx`,
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                };
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    // Create visualization
    createVisualization(dataset: Dataset, type: string, config: Record<string, any>): Visualization {
        const chartConfig = {
            ...config,
            responsive: true,
            plugins: {
                legend: { position: 'top' as const },
                title: { display: true, text: config.title || 'Chart' },
            },
        };

        let data: any;

        switch (type) {
            case 'bar':
                data = this.createBarChartData(dataset, config);
                break;
            case 'line':
                data = this.createLineChartData(dataset, config);
                break;
            case 'pie':
                data = this.createPieChartData(dataset, config);
                break;
            case 'scatter':
                data = this.createScatterChartData(dataset, config);
                break;
            case 'histogram':
                data = this.createHistogramData(dataset, config);
                break;
            case 'heatmap':
                data = this.createHeatmapData(dataset, config);
                break;
            default:
                data = this.createBarChartData(dataset, config);
        }

        return {
            type: type as any,
            title: config.title || 'Visualization',
            data,
            config: chartConfig,
        };
    }

    // Predict (simple forecasting)
    async predict(datasetId: string, column: string, periods: number): Promise<{
        predictions: number[];
        confidence: number[];
        method: string;
    }> {
        const dataset = this.datasets.get(datasetId);
        if (!dataset) {
            throw new Error(`Dataset not found: ${datasetId}`);
        }

        // In real implementation, this would use ML models
        // For now, return simple moving average prediction
        const values = dataset.rows
            .map(row => row[column])
            .filter(v => typeof v === 'number');

        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        const predictions: number[] = [];
        const confidence: number[] = [];

        for (let i = 0; i < periods; i++) {
            predictions.push(avg * (1 + (Math.random() - 0.5) * 0.1));
            confidence.push(0.8 - (i * 0.05));
        }

        return {
            predictions,
            confidence,
            method: 'moving_average',
        };
    }

    // Handle general data task
    private async handleGeneralDataTask(intent: ParsedIntent): Promise<any> {
        const input = intent.rawInput.toLowerCase();

        if (input.includes('load') || input.includes('import')) {
            return {
                message: 'Ready to load data',
                supportedFormats: ['csv', 'json', 'xlsx', 'parquet'],
            };
        }

        if (input.includes('visualize') || input.includes('chart')) {
            return {
                message: 'Ready to create visualization',
                chartTypes: ['bar', 'line', 'pie', 'scatter', 'histogram', 'heatmap'],
            };
        }

        if (input.includes('export') || input.includes('download')) {
            return {
                message: 'Ready to export data',
                formats: this.config.exportFormats,
            };
        }

        return {
            message: 'Data agent ready',
            suggestions: [
                'Load a dataset',
                'Analyze data',
                'Create visualization',
                'Query database',
                'Export data',
            ],
        };
    }

    // Helper methods
    private generateSummary(dataset: Dataset): DataSummary {
        const missingValues: Record<string, number> = {};
        const types: Record<string, string> = {};

        dataset.columns.forEach(col => {
            missingValues[col.name] = dataset.rows.filter(row => row[col.name] == null).length;
            types[col.name] = col.type;
        });

        const duplicates = dataset.rows.length - new Set(dataset.rows.map(row => JSON.stringify(row))).size;

        return {
            rowCount: dataset.rows.length,
            columnCount: dataset.columns.length,
            missingValues,
            duplicates,
            types,
        };
    }

    private calculateStatistics(dataset: Dataset): Statistics {
        const numeric: Record<string, NumericStats> = {};
        const categorical: Record<string, CategoricalStats> = {};
        const temporal: Record<string, TemporalStats> = {};

        dataset.columns.forEach(col => {
            const values = dataset.rows.map(row => row[col.name]).filter(v => v != null);

            if (col.type === 'number') {
                numeric[col.name] = this.calculateNumericStats(values as number[]);
            } else if (col.type === 'string') {
                categorical[col.name] = this.calculateCategoricalStats(values as string[]);
            } else if (col.type === 'date') {
                temporal[col.name] = this.calculateTemporalStats(values as Date[]);
            }
        });

        return { numeric, categorical, temporal };
    }

    private calculateNumericStats(values: number[]): NumericStats {
        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;

        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean,
            median: sorted[Math.floor(sorted.length / 2)],
            mode: this.calculateMode(values),
            stdDev,
            variance,
            quartiles: [
                sorted[Math.floor(sorted.length * 0.25)],
                sorted[Math.floor(sorted.length * 0.5)],
                sorted[Math.floor(sorted.length * 0.75)],
            ],
        };
    }

    private calculateCategoricalStats(values: string[]): CategoricalStats {
        const frequency: Record<string, number> = {};
        values.forEach(v => {
            frequency[v] = (frequency[v] || 0) + 1;
        });

        const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
        const top = sorted.slice(0, 5).map(([value, count]) => ({ value, count }));

        return {
            unique: Object.keys(frequency).length,
            top,
            frequency,
        };
    }

    private calculateTemporalStats(values: Date[]): TemporalStats {
        const sorted = [...values].sort((a, b) => a.getTime() - b.getTime());
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const range = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));

        return {
            min,
            max,
            range,
            gaps: 0, // Would calculate actual gaps
        };
    }

    private calculateMode(values: number[]): number {
        const frequency: Record<number, number> = {};
        values.forEach(v => {
            frequency[v] = (frequency[v] || 0) + 1;
        });

        return parseInt(
            Object.entries(frequency).sort((a, b) => b[1] - a[1])[0][0]
        );
    }

    private findCorrelations(dataset: Dataset): Correlation[] {
        const correlations: Correlation[] = [];
        const numericColumns = dataset.columns.filter(c => c.type === 'number');

        for (let i = 0; i < numericColumns.length; i++) {
            for (let j = i + 1; j < numericColumns.length; j++) {
                const col1 = numericColumns[i].name;
                const col2 = numericColumns[j].name;

                const coefficient = this.calculateCorrelation(
                    dataset.rows.map(r => r[col1]),
                    dataset.rows.map(r => r[col2])
                );

                const strength = this.getCorrelationStrength(Math.abs(coefficient));

                correlations.push({ column1: col1, column2: col2, coefficient, strength });
            }
        }

        return correlations;
    }

    private calculateCorrelation(x: number[], y: number[]): number {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
        const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
        const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    private getCorrelationStrength(absCoef: number): 'strong' | 'moderate' | 'weak' | 'none' {
        if (absCoef >= 0.7) return 'strong';
        if (absCoef >= 0.4) return 'moderate';
        if (absCoef >= 0.1) return 'weak';
        return 'none';
    }

    private generateInsights(
        dataset: Dataset,
        statistics: Statistics,
        correlations: Correlation[]
    ): string[] {
        const insights: string[] = [];

        // Data quality insights
        const missingCount = Object.values(statistics.numeric).length;
        if (missingCount > 0) {
            insights.push(`Dataset contains ${dataset.rows.length} rows across ${dataset.columns.length} columns`);
        }

        // Correlation insights
        const strongCorrelations = correlations.filter(c => c.strength === 'strong');
        if (strongCorrelations.length > 0) {
            insights.push(`Found ${strongCorrelations.length} strong correlations between variables`);
        }

        // Distribution insights
        Object.entries(statistics.numeric).forEach(([col, stats]) => {
            if (stats.stdDev > stats.mean) {
                insights.push(`${col} has high variability (stdDev > mean)`);
            }
        });

        return insights;
    }

    private createVisualizations(dataset: Dataset, analysisType: string): Visualization[] {
        const visualizations: Visualization[] = [];

        // Create histogram for each numeric column
        dataset.columns
            .filter(c => c.type === 'number')
            .slice(0, 3)
            .forEach(col => {
                visualizations.push(this.createVisualization(dataset, 'histogram', {
                    column: col.name,
                    title: `Distribution of ${col.name}`,
                }));
            });

        // Create bar chart for categorical columns
        dataset.columns
            .filter(c => c.type === 'string')
            .slice(0, 2)
            .forEach(col => {
                visualizations.push(this.createVisualization(dataset, 'bar', {
                    column: col.name,
                    title: `${col.name} Distribution`,
                }));
            });

        return visualizations;
    }

    private createBarChartData(dataset: Dataset, config: Record<string, any>): any {
        return {
            labels: [],
            datasets: [{
                label: config.column,
                data: [],
            }],
        };
    }

    private createLineChartData(dataset: Dataset, config: Record<string, any>): any {
        return {
            labels: [],
            datasets: [{
                label: config.column,
                data: [],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
            }],
        };
    }

    private createPieChartData(dataset: Dataset, config: Record<string, any>): any {
        return {
            labels: [],
            datasets: [{
                data: [],
            }],
        };
    }

    private createScatterChartData(dataset: Dataset, config: Record<string, any>): any {
        return {
            datasets: [{
                label: `${config.xColumn} vs ${config.yColumn}`,
                data: [],
            }],
        };
    }

    private createHistogramData(dataset: Dataset, config: Record<string, any>): any {
        return {
            labels: [],
            datasets: [{
                label: config.column,
                data: [],
            }],
        };
    }

    private createHeatmapData(dataset: Dataset, config: Record<string, any>): any {
        return {
            labels: [],
            datasets: [],
        };
    }

    private applyFilter(rows: Record<string, any>[], config: Record<string, any>): Record<string, any>[] {
        const { column, operator, value } = config;

        return rows.filter(row => {
            const cellValue = row[column];

            switch (operator) {
                case 'eq': return cellValue === value;
                case 'neq': return cellValue !== value;
                case 'gt': return cellValue > value;
                case 'gte': return cellValue >= value;
                case 'lt': return cellValue < value;
                case 'lte': return cellValue <= value;
                case 'contains': return String(cellValue).includes(value);
                case 'startsWith': return String(cellValue).startsWith(value);
                case 'endsWith': return String(cellValue).endsWith(value);
                default: return true;
            }
        });
    }

    private applySort(rows: Record<string, any>[], config: Record<string, any>): Record<string, any>[] {
        const { column, direction = 'asc' } = config;

        return [...rows].sort((a, b) => {
            const aVal = a[column];
            const bVal = b[column];

            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    private applyGroup(rows: Record<string, any>[], config: Record<string, any>): Record<string, any>[] {
        const { column } = config;
        const groups: Record<string, Record<string, any>[]> = {};

        rows.forEach(row => {
            const key = row[column];
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
        });

        return Object.entries(groups).map(([key, groupRows]) => ({
            [column]: key,
            count: groupRows.length,
        }));
    }

    private applyAggregate(rows: Record<string, any>[], config: Record<string, any>): Record<string, any>[] {
        const { groupBy, aggregations } = config;

        // Group rows
        const groups: Record<string, Record<string, any>[]> = {};
        rows.forEach(row => {
            const key = row[groupBy];
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
        });

        // Apply aggregations
        return Object.entries(groups).map(([key, groupRows]) => {
            const result: Record<string, any> = { [groupBy]: key };

            aggregations.forEach((agg: { column: string; function: string }) => {
                const values = groupRows.map(r => r[agg.column]).filter(v => typeof v === 'number');

                switch (agg.function) {
                    case 'sum':
                        result[`${agg.column}_sum`] = values.reduce((a, b) => a + b, 0);
                        break;
                    case 'avg':
                        result[`${agg.column}_avg`] = values.reduce((a, b) => a + b, 0) / values.length;
                        break;
                    case 'min':
                        result[`${agg.column}_min`] = Math.min(...values);
                        break;
                    case 'max':
                        result[`${agg.column}_max`] = Math.max(...values);
                        break;
                    case 'count':
                        result[`${agg.column}_count`] = values.length;
                        break;
                }
            });

            return result;
        });
    }

    private applyPivot(rows: Record<string, any>[], config: Record<string, any>): Record<string, any>[] {
        // Simplified pivot implementation
        return rows;
    }

    private toCSV(rows: Record<string, any>[]): string {
        if (rows.length === 0) return '';

        const headers = Object.keys(rows[0]);
        const lines = [headers.join(',')];

        rows.forEach(row => {
            const values = headers.map(h => {
                const val = row[h];
                if (typeof val === 'string' && val.includes(',')) {
                    return `"${val}"`;
                }
                return val;
            });
            lines.push(values.join(','));
        });

        return lines.join('\n');
    }

    // Get dataset
    getDataset(id: string): Dataset | undefined {
        return this.datasets.get(id);
    }

    // Get all datasets
    getAllDatasets(): Dataset[] {
        return Array.from(this.datasets.values());
    }

    // Delete dataset
    deleteDataset(id: string): boolean {
        return this.datasets.delete(id);
    }
}

// Export factory function
export function createDataAgent(config?: Partial<DataAgentConfig>): DataAgent {
    return new DataAgent(config);
}
