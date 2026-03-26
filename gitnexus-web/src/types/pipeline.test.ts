import { describe, expect, it } from 'vitest';
import { createKnowledgeGraph } from '../core/graph/graph';
import type { GraphNode, GraphRelationship } from '../core/graph/types';
import { deserializePipelineResult, serializePipelineResult, type SerializablePipelineResult } from './pipeline';

const sampleNode = (id: string, name: string): GraphNode => ({
  id,
  label: 'File',
  properties: {
    name,
    filePath: `src/${name}`,
  },
});

const sampleRelationship = (id: string): GraphRelationship => ({
  id,
  sourceId: 'File:src/index.ts',
  targetId: 'File:src/utils.ts',
  type: 'IMPORTS',
  confidence: 1,
  reason: 'unit-test',
});

describe('pipeline serialization helpers', () => {
  it('serializes graph arrays and file contents into plain objects', () => {
    const graph = createKnowledgeGraph();
    const node = sampleNode('File:src/index.ts', 'index.ts');
    const relationship = sampleRelationship('rel-1');
    graph.addNode(node);
    graph.addRelationship(relationship);

    const serialized = serializePipelineResult({
      graph,
      fileContents: new Map([['src/index.ts', 'console.log(\"hi\")']]),
    });

    expect(serialized.nodes).toEqual([node]);
    expect(serialized.relationships).toEqual([relationship]);
    expect(serialized.fileContents).toEqual({ 'src/index.ts': 'console.log(\"hi\")' });
  });

  it('deserializes a serializable result back into a graph and map', () => {
    const serialized: SerializablePipelineResult = {
      nodes: [sampleNode('File:src/index.ts', 'index.ts')],
      relationships: [sampleRelationship('rel-1')],
      fileContents: { 'src/index.ts': 'export {}' },
    };

    const result = deserializePipelineResult(serialized, createKnowledgeGraph);

    expect(result.graph.nodeCount).toBe(1);
    expect(result.graph.relationshipCount).toBe(1);
    expect(result.fileContents.get('src/index.ts')).toBe('export {}');
  });

  it('handles duplicate serialized graph entries through graph reconstruction', () => {
    const duplicateNode = sampleNode('File:src/index.ts', 'index.ts');
    const duplicateRelationship = sampleRelationship('rel-1');
    const serialized: SerializablePipelineResult = {
      nodes: [duplicateNode, duplicateNode],
      relationships: [duplicateRelationship, duplicateRelationship],
      fileContents: {},
    };

    const result = deserializePipelineResult(serialized, createKnowledgeGraph);

    expect(result.graph.nodeCount).toBe(1);
    expect(result.graph.relationshipCount).toBe(1);
    expect(result.fileContents.size).toBe(0);
  });
});
