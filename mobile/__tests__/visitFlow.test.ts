import {processingSequence} from '../src/utils/visitFlow';

describe('visit flow', () => {
  it('keeps the simulated processing sequence stable', () => {
    expect(processingSequence).toEqual([
      'Transcribing',
      'ExtractingHistory',
      'GeneratingNote',
      'Complete',
    ]);
  });
});
