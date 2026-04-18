import { annotateChanges, buildAnnotationMap, formatAnnotatedChange, AnnotationMap } from './annotate';
import { RouteChange } from './differ';

const added: RouteChange = { status: 'added', route: '/api/users', methods: ['GET'] } as any;
const removed: RouteChange = { status: 'removed', route: '/api/old', methods: ['DELETE'] } as any;

describe('buildAnnotationMap', () => {
  it('builds keyed map from entries', () => {
    const map = buildAnnotationMap([
      { route: '/api/users', status: 'added', annotation: 'New user endpoint', author: 'alice' },
    ]);
    expect(map['added:/api/users']).toMatchObject({
      annotation: 'New user endpoint',
      author: 'alice',
    });
  });

  it('includes a timestamp', () => {
    const map = buildAnnotationMap([{ route: '/api/x', status: 'removed', annotation: 'deprecated' }]);
    expect(map['removed:/api/x'].timestamp).toBeDefined();
  });
});

describe('annotateChanges', () => {
  it('merges annotation into matching change', () => {
    const map: AnnotationMap = {
      'added:/api/users': { annotation: 'New user endpoint', author: 'alice' },
    };
    const result = annotateChanges([added, removed], map);
    expect(result[0].annotation).toBe('New user endpoint');
    expect(result[0].author).toBe('alice');
  });

  it('leaves unmatched changes unchanged', () => {
    const result = annotateChanges([removed], {});
    expect(result[0].annotation).toBeUndefined();
  });

  it('adds timestamp when annotation is present', () => {
    const map: AnnotationMap = { 'added:/api/users': { annotation: 'hi' } };
    const result = annotateChanges([added], map);
    expect(result[0].timestamp).toBeDefined();
  });
});

describe('formatAnnotatedChange', () => {
  it('formats change without annotation', () => {
    const out = formatAnnotatedChange({ ...added });
    expect(out).toBe('[ADDED] /api/users');
  });

  it('formats change with annotation and author', () => {
    const out = formatAnnotatedChange({ ...added, annotation: 'New endpoint', author: 'bob' });
    expect(out).toContain('Note: New endpoint');
    expect(out).toContain('bob');
  });

  it('formats change with annotation only', () => {
    const out = formatAnnotatedChange({ ...added, annotation: 'Just a note' });
    expect(out).toContain('Just a note');
    expect(out).not.toContain('—');
  });
});
