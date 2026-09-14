import { describe, it, expect } from 'vitest';
import { shortName } from './names';

describe('shortName', () => {
  it('uses the first name when it is unique', () => {
    expect(shortName('Marcus Jones', ['Marcus Jones', 'Dev Patel'])).toBe('Marcus');
  });

  it('adds a last initial when two players share a first name', () => {
    const all = ['Marcus Jones', 'Marcus Lee'];
    expect(shortName('Marcus Jones', all)).toBe('Marcus J.');
    expect(shortName('Marcus Lee', all)).toBe('Marcus L.');
  });

  it('copes with single names and empty input', () => {
    expect(shortName('Kai', ['Kai', 'Kai'])).toBe('Kai');
    expect(shortName('', [])).toBe('');
  });
});
