import { describe, it, expect } from 'vitest';
import {
  isRTLText,
  findIntersectingQuads,
  TextQuad,
} from '../annotations/highlight-detector';

describe('Highlight Detection & RTL Handling', () => {
  it('should detect RTL text in Arabic', () => {
    expect(isRTLText('مرحبا بكم في الاختبار')).toBe(true);
    expect(isRTLText('Hello World')).toBe(false);
    expect(isRTLText('English with Arabic كلمة inside')).toBe(true);
  });

  it('should find intersecting quads correctly', () => {
    const quads: TextQuad[] = [
      {
        str: 'Word1',
        dir: 'ltr',
        x: 50,
        y: 100,
        width: 40,
        height: 15,
        isRTL: false,
      },
      {
        str: 'Word2',
        dir: 'ltr',
        x: 95,
        y: 100,
        width: 40,
        height: 15,
        isRTL: false,
      },
      {
        str: 'OtherLine',
        dir: 'ltr',
        x: 50,
        y: 200,
        width: 80,
        height: 15,
        isRTL: false,
      },
    ];

    // Select over Word1 & Word2
    const selection = {
      x: 45,
      y: 95,
      width: 100,
      height: 25,
    };

    const hits = findIntersectingQuads(selection, quads);
    expect(hits.length).toBe(2);
    expect(hits[0].x).toBe(50);
    expect(hits[1].x).toBe(95);
  });

  it('should fallback to selection rectangle on scanned / no text pages', () => {
    const selection = {
      x: 50,
      y: 100,
      width: 120,
      height: 30,
    };

    const hits = findIntersectingQuads(selection, []); // empty quads (scanned PDF)
    expect(hits.length).toBe(1);
    expect(hits[0]).toEqual(selection);
  });
});
