describe('aznCosts', () => {
  it('should test existingCost exists > 0.3 and newCosts <=0.3', () => {
    const existingCosts = {
      azn: 2.0,
    };
    const newCosts = {
      azn: 0.3,
    };

    expect(
      ((existingCosts && existingCosts.azn <= 0.3) || !existingCosts?.azn) &&
        newCosts.azn <= 0.3
    ).toBe(false);
  });
  it('should test existingCost exists === 0.3 and newCosts <=0.3', () => {
    const existingCosts = {
      azn: 0.3,
    };
    const newCosts = {
      azn: 0.3,
    };

    expect(
      ((existingCosts && existingCosts.azn <= 0.3) || !existingCosts?.azn) &&
        newCosts.azn <= 0.3
    ).toBe(true);
  });
  it('should test existingCost missing and newCosts > 0.3', () => {
    const existingCosts: any = {};
    const newCosts = {
      azn: 0.4,
    };

    expect(
      ((existingCosts && existingCosts.azn <= 0.3) || !existingCosts?.azn) &&
        newCosts.azn <= 0.3
    ).toBe(false);
  });
  

  it('should test existingCost missing and newCosts > 0.3', () => {
    const existingCosts: any = {};
    const newCosts = {
      azn: 0.3,
    };

    expect(
      ((existingCosts && existingCosts.azn <= 0.3) || !existingCosts?.azn) &&
        newCosts.azn <= 0.3
    ).toBe(true);
  });
});
