import { describe, expect, it } from 'vitest';
import { createKnowledgeGraph } from './graph';
import type { GraphNode, GraphRelationship } from './types';

const createNode = (id: string, name: string): GraphNode => ({
  id,
  label: 'Function',
  properties: {
    name,
    filePath: 'src/example.ts',
    startLine: 1,
    endLine: 3,
  },
});

const createRelationship = (id: string): GraphRelationship => ({
  id,
  sourceId: 'Function:alpha',
  targetId: 'Function:beta',
  type: 'CALLS',
  confidence: 1,
  reason: 'unit-test',
});

describe('createKnowledgeGraph', () => {
  it('starts empty with zero counts', () => {
    const graph = createKnowledgeGraph();

    expect(graph.nodes).toEqual([]);
    expect(graph.relationships).toEqual([]);
    expect(graph.nodeCount).toBe(0);
    expect(graph.relationshipCount).toBe(0);
  });

  it('adds unique nodes and relationships', () => {
    const graph = createKnowledgeGraph();

    graph.addNode(createNode('Function:alpha', 'alpha'));
    graph.addNode(createNode('Function:beta', 'beta'));
    graph.addRelationship(createRelationship('rel-1'));

    expect(graph.nodeCount).toBe(2);
    expect(graph.relationshipCount).toBe(1);
    expect(graph.nodes.map(node => node.id)).toEqual(['Function:alpha', 'Function:beta']);
    expect(graph.relationships[0].id).toBe('rel-1');
  });

  it('ignores duplicate ids and keeps the first inserted values', () => {
    const graph = createKnowledgeGraph();

    graph.addNode(createNode('Function:alpha', 'alpha'));
    graph.addNode(createNode('Function:alpha', 'replacement'));
    graph.addRelationship(createRelationship('rel-1'));
    graph.addRelationship({ ...createRelationship('rel-1'), reason: 'duplicate' });

    expect(graph.nodeCount).toBe(1);
    expect(graph.relationshipCount).toBe(1);
    expect(graph.nodes[0].properties.name).toBe('alpha');
    expect(graph.relationships[0].reason).toBe('unit-test');
  });
});
