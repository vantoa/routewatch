import { groupChanges, groupByPrefix, groupByStatus, groupByMethod } from './group';
import { RouteChange } from './differ';

const changes: RouteChange[] = [
  { type: 'added', route: '/api/users', methods: ['GET', 'POST'] },
  { type: 'removed', route: '/api/posts', methods: ['GET'] },
  { type: 'modified', route: '/api/users/[id]', added: ['DELETE'], removed: ['PUT'] },
  { type: 'added', route: '/health', methods: ['GET'] },
];

describe('groupByStatus', () => {
  it('groups changes by type', () => {
    const result = groupByStatus(changes);
    const added = result.find(g => g.key === 'added');
    const removed = result.find(g => g.key === 'removed');
    expect(added?.changes).toHaveLength(2);
    expect(removed?.changes).toHaveLength(1);
  });
});

describe('groupByPrefix', () => {
  it('groups by first path segment', () => {
    const result = groupByPrefix(changes);
    const api = result.find(g => g.key === '/api');
    const health = result.find(g => g.key === '/health');
    expect(api?.changes).toHaveLength(3);
    expect(health?.changes).toHaveLength(1);
  });
});

describe('groupByMethod', () => {
  it('groups by method set', () => {
    const result = groupByMethod(changes);
    const getOnly = result.find(g => g.key === 'GET');
    expect(getOnly).toBeDefined();
  });
});

describe('groupChanges', () => {
  it('delegates to correct grouper', () => {
    expect(groupChanges(changes, 'status')).toEqual(groupByStatus(changes));
    expect(groupChanges(changes, 'prefix')).toEqual(groupByPrefix(changes));
    expect(groupChanges(changes, 'method')).toEqual(groupByMethod(changes));
  });
});
