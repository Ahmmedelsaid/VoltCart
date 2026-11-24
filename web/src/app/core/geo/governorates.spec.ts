import { GOVERNORATES, matchGovernorate } from './governorates';

describe('matchGovernorate', () => {
  it('matches the English name with or without the "Governorate" suffix', () => {
    expect(matchGovernorate('Cairo Governorate')?.value).toBe('Cairo');
    expect(matchGovernorate('Giza')?.value).toBe('Giza');
  });

  it('matches the Arabic name with the "محافظة" prefix', () => {
    expect(matchGovernorate('محافظة القاهرة')?.value).toBe('Cairo');
    expect(matchGovernorate('الإسكندرية')?.value).toBe('Alexandria');
  });

  it('matches common transliterations', () => {
    expect(matchGovernorate('Ad Daqahliyah Governorate')?.value).toBe('Dakahlia');
    expect(matchGovernorate('Kafr el-Sheikh')?.value).toBe('Kafr El Sheikh');
  });

  it('prefers the ISO code, which does not depend on how the name is spelled', () => {
    expect(matchGovernorate('Al Qalyubiya', 'EG-KB')?.value).toBe('Qalyubia');
    expect(matchGovernorate(null, 'EG-GZ')?.value).toBe('Giza');
    expect(matchGovernorate('Cairo', 'EG-XX')?.value).toBe('Cairo');
  });

  it('returns null for unknown or empty input', () => {
    expect(matchGovernorate('Atlantis')).toBeNull();
    expect(matchGovernorate('')).toBeNull();
    expect(matchGovernorate(null)).toBeNull();
  });

  it('lists each governorate once', () => {
    const values = GOVERNORATES.map((g) => g.value);
    expect(new Set(values).size).toBe(values.length);
    expect(values.length).toBe(27);
  });
});
