import type { DeckList } from '../src/generated/lobby/lobby';

export const testDeck: DeckList = {
  name: 'Izzet Skred Delver',
  cards: [
    { cardName: 'Delver of Secrets', setCode: 'MID', cardNumber: '47', amount: 4 },
    { cardName: 'Thermo-Alchemist', setCode: 'DBL', cardNumber: '164', amount: 4 },
    { cardName: 'Tolarian Terror', setCode: 'FDN', cardNumber: '167', amount: 4 },
    { cardName: 'Brainstorm', setCode: 'DSC', cardNumber: '113', amount: 4 },
    { cardName: 'Counterspell', setCode: 'DMR', cardNumber: '45', amount: 4 },
    { cardName: 'Lightning Bolt', setCode: 'SLD', cardNumber: '83', amount: 4 },
    { cardName: 'Skred', setCode: 'CSP', cardNumber: '97', amount: 4 },
    { cardName: 'Thunderous Wrath', setCode: 'MM3', cardNumber: '113', amount: 4 },
    { cardName: 'Spell Pierce', setCode: 'XLN', cardNumber: '81', amount: 2 },
    { cardName: 'Lorien Revealed', setCode: 'LTR', cardNumber: '60', amount: 4 },
    { cardName: 'Ponder', setCode: 'DSC', cardNumber: '73', amount: 4 },
    { cardName: 'Snow-Covered Island', setCode: 'KHM', cardNumber: '278', amount: 7 },
    { cardName: 'Maestros Theater', setCode: 'SNC', cardNumber: '251', amount: 4 },
    { cardName: 'Volatile Fjord', setCode: 'KHM', cardNumber: '273', amount: 4 },
    { cardName: 'Snow-Covered Mountain', setCode: 'KHM', cardNumber: '282', amount: 3 },
  ],
  sideboard: [
    { cardName: 'Cast into the Fire', setCode: 'LTR', cardNumber: '118', amount: 4 },
    { cardName: 'Dispel', setCode: 'RTR', cardNumber: '36', amount: 4 },
    { cardName: 'Red Elemental Blast', setCode: '30A', cardNumber: '165', amount: 4 },
    { cardName: 'Fiery Cannonade', setCode: 'CMR', cardNumber: '178', amount: 3 },
  ],
};
