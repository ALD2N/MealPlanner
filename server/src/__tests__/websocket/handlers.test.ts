import { broadcastMealUpdated } from '../../websocket/handlers';
import { IMealSelectionResponse } from '@dndmeal/shared';

describe('broadcastMealUpdated', () => {
  it('broadcasts meal:updated event to all clients', () => {
    const mockIo = {
      emit: jest.fn(),
    };

    const meal: IMealSelectionResponse = {
      _id: 'meal123',
      recipe: {
        _id: 'recipe123',
        title: 'Test Recipe',
        image: 'image.jpg',
        ingredients: ['ingredient1'],
        steps: ['step1'],
        author: { _id: 'author1', name: 'Author', email: 'author@example.com', isAdmin: false, createdAt: new Date() },
        tags: [],
        ratings: [],
        timesChosen: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      selectedBy: { _id: 'user456', name: 'Alice', email: 'alice@example.com', isAdmin: false, createdAt: new Date() },
      status: 'confirmed',
      date: new Date(),
      createdAt: new Date(),
    };

    broadcastMealUpdated(mockIo as any, { meal });

    expect(mockIo.emit).toHaveBeenCalledWith('meal:updated', { meal });
  });
});
