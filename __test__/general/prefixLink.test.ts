import { prefixLink } from '@dipmaxtech/clr-pkg';
import { describe, expect, test } from '@jest/globals';

describe('prefixLink', () => {
  const example = [
    {
      url: '/Images/300x251/2884145_31ea132340a3.png',
      domain: 'proshop.de',
      expected: 'https://www.proshop.de/Images/300x251/2884145_31ea132340a3.png',
    },
    {
      url: '/Images/300x251/2884145_31ea132340a3.png',
      domain: 'proshop.de',
      expected: 'https://www.proshop.de/Images/300x251/2884145_31ea132340a3.png',
    },
    {
      url: "tv-audio/heimkino-systeme.html",
      domain: "cyberport.de",
      expected: "https://www.cyberport.de/tv-audio/heimkino-systeme.html"
    }
  ]
  example.forEach((ex) => {
    test(`prefixLink ${ex.url} ${ex.domain}`, () => {
      expect(prefixLink(ex.url, ex.domain)).toBe(ex.expected);
    });
  });
});