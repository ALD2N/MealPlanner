import { broadcastMealUpdated } from '../../websocket/handlers';

describe('broadcastMealUpdated', () => {
  it('broadcasts meal:updated event to all clients', () => {
    const mockIo = {
      emit: jest.fn(),
    };

    const meal = {
      _id: 'meal123',
      recipe: {},
      selectedBy: { _id: 'user456', name: 'Alice' },
      status: 'confirmed',
      date: new Date(),
    };

    broadcastMealUpdated(mockIo as any, { meal });

    expect(mockIo.emit).toHaveBeenCalledWith('meal:updated', { meal });
  });
});
