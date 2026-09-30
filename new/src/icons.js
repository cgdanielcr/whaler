// Small drawn icons for the stations, so the deck can say what each place is
// without a line of text over it: a spyglass aloft, the wheel, the try-pots,
// the cutting spade, the galley kettle, the carpenter's hammer, the mincing
// knife, the steward's cup, the cooper's cask.
const P = {
  spyglass: '<path d="M3.5 16.5l8-4.5 1.8 3-8 4.5z"/><path d="M11.8 11.6l5.4-3.1 2.3 4-5.4 3.1z"/><path d="M8 19.5l-1.5 2.5M12 17.4l1.5 4.6" fill="none" stroke-width="1.5"/>',
  wheel: '<circle cx="12" cy="12" r="5.5" fill="none" stroke-width="2"/><circle cx="12" cy="12" r="1.6"/><path d="M12 2.5v19M2.5 12h19M5.3 5.3l13.4 13.4M18.7 5.3L5.3 18.7" fill="none" stroke-width="1.5"/>',
  pots: '<path d="M4 11h16l-1.6 8H5.6z"/><path d="M8.5 8c0-2 2-2 2-4.5M13.5 8c0-2 2-2 2-4.5" fill="none" stroke-width="1.6"/>',
  spade: '<path d="M12 2.5v11" fill="none" stroke-width="2"/><path d="M7.5 13.5h9L12 21.5z"/>',
  kettle: '<path d="M6 10.5h12v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4z"/><path d="M8 10.5a4 4 0 0 1 8 0M18 12.5l3-2" fill="none" stroke-width="1.6"/>',
  hammer: '<path d="M5 20.5l8.5-8.5" fill="none" stroke-width="2.4"/><path d="M10 6.5l4.5-3 6 6-3 4.5z"/>',
  knife: '<path d="M4 20.5L15.5 9l3.5.8-.8 3.5L6.8 22.8z"/><path d="M18 10.5l2.5-2.5" fill="none" stroke-width="2"/>',
  cup: '<path d="M5 7.5h11v6a5.5 5.5 0 0 1-11 0z"/><path d="M16 9.5h2a2.5 2.5 0 0 1 0 5h-2" fill="none" stroke-width="1.6"/>',
  cask: '<path d="M6.5 4.5h11c1.5 5 1.5 10 0 15h-11c-1.5-5-1.5-10 0-15z"/><path d="M6 9.5h12M6 14.5h12" fill="none" stroke="#1d1409" stroke-width="1.3"/>',
};

export const STATION_ICON = { foreMast: 'spyglass', mainMast: 'spyglass', wheel: 'wheel', tryworks: 'pots', cutting: 'spade',
  galley: 'kettle', bench: 'hammer', blubber: 'knife', pantry: 'cup', cooper: 'cask' };

export const icon = (name) => `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="0">${P[name] || ''}</svg>`;
