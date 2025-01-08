import { differenceInHours, parseISO } from 'date-fns';

describe('updateListing', () => {
  it('should check difference in hours', () => {
    const parsed = parseISO(
      '2025-01-06T10:49:24.557Z' || '2025-01-04T05:43:02.309Z'
    );

    console.log('parsed:', parsed);
    const current  = new Date('2025-01-06T10:49:24.557Z' || '2025-01-04T05:43:02.309Z')
    console.log('current:', current)
    const diffHours = differenceInHours(
      new Date(),
      current
    );

    console.log('diffHours:', diffHours);
    expect(diffHours).toBeGreaterThan(24);
  });
});
