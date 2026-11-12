// The title page: laid over the harbour before anything begins. Take a new
// command, or go on with the one remembered; and two switches, for sound and
// for how the picture is finished: painted in oils, plain, or fine.
import { sound } from './sound.js';
import { money } from './stores.js';

const $ = (id) => document.getElementById(id);

// begin(continuing) is called once the owner has chosen.
export function showTitle(career, begin) {
  const saved = career.peek();
  const KINDS = ['painted', 'plain', 'fine'];
  let picture = 'painted';
  try { picture = localStorage.getItem('whaler-picture') || 'painted'; } catch { /* no storage */ }
  const go = (cont) => { document.body.classList.remove('pre'); $('title').classList.add('gone'); setTimeout(() => { $('title').hidden = true; }, 700); begin(cont); };

  $('titleGo').onclick = () => go(false);
  $('titleOn').hidden = !saved;
  if (saved) {
    $('titleOn').innerHTML = `Go on with your command<small>Voyage ${saved.voyages + 1} · ${money(saved.landed)} landed · ${saved.purse >= 0 ? money(saved.purse) : '$0'} in your purse</small>`;
    $('titleOn').onclick = () => go(true);
    $('titleGo').classList.add('lesser');
    $('titleGo').textContent = 'Take a new command';
  }
  const label = () => {
    $('titleSound').textContent = `Sound: ${sound.on ? 'on' : 'off'}`;
    $('titleFine').textContent = `Picture: ${picture}`;
  };
  $('titleSound').onclick = () => { sound.toggle(); label(); };
  $('titleFine').onclick = () => { try { localStorage.setItem('whaler-picture', KINDS[(KINDS.indexOf(picture) + 1) % 3]); } catch { /* no storage */ } location.reload(); };
  $('titleHow').onclick = () => { $('howCard').hidden = !$('howCard').hidden; };
  label();
}
