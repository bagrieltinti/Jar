// events.js - Data-driven yearly events definitions.

import illnesses from './illnesses.js';
import { chance, pickOne } from '../core/random.js';

const events = [
  {
    id: 'parent_job_loss',
    tags: ['family', 'economy'],
    minAge: 6,
    maxAge: 18,
    weight: 2,
    apply: (player) => {
      player.modifyStat('happiness', -5);
      player.addLog('One of my parents lost their job. Things might be tight for a while.', ['family']);
    },
  },
  {
    id: 'toddler_giggle',
    tags: ['flavor'],
    minAge: 0,
    maxAge: 3,
    weight: 4,
    apply: (player) => player.addLog('I babbled a series of nonsense sounds that had everyone laughing.', ['toddler']),
  },
  {
    id: 'classmate_praise',
    tags: ['school'],
    minAge: 7,
    maxAge: 18,
    weight: 3,
    apply: (player) => {
      player.modifyStat('happiness', 3);
      player.addLog('A classmate said I was pretty cool today.', ['school']);
    },
  },
  {
    id: 'classmate_tease',
    tags: ['school'],
    minAge: 8,
    maxAge: 17,
    weight: 3,
    apply: (player) => {
      player.modifyStat('happiness', -4);
      player.addLog('Someone called me lame in front of the class. Ouch.', ['school']);
    },
  },
  {
    id: 'green_liquid',
    tags: ['random'],
    minAge: 4,
    maxAge: 70,
    weight: 2,
    apply: (player) => {
      player.modifyStat('happiness', pickOne([-3, 2, 4]));
      player.addLog('I stepped into a mysterious green liquid on the sidewalk. Probably fine.', ['weird']);
    },
  },
  {
    id: 'flu_event',
    tags: ['health'],
    minAge: 4,
    maxAge: 70,
    weight: 4,
    condition: (player) => !player.hasIllness('flu'),
    apply: (player) => {
      player.addIllness('flu');
      player.addLog('I caught a nasty flu and feel miserable.', ['health']);
    },
  },
  {
    id: 'flu_recovery',
    tags: ['health'],
    minAge: 4,
    maxAge: 80,
    weight: 1,
    condition: (player) => player.hasIllness('flu'),
    apply: (player) => {
      player.removeIllness('flu');
      player.modifyStat('health', 5);
      player.addLog('Finally beat the flu!', ['health']);
    },
  },
  {
    id: 'sibling_argument',
    tags: ['family'],
    minAge: 6,
    maxAge: 25,
    weight: 2,
    apply: (player, state) => {
      if (!state.npcs.length) return;
      const sibling = state.npcs.find((n) => n.relationshipType === 'sibling');
      if (!sibling) return;
      player.modifyStat('happiness', -3);
      player.addLog(`My sibling ${sibling.name} and I argued about snacks.`, ['family']);
    },
  },
  {
    id: 'friend_email',
    tags: ['friend'],
    minAge: 10,
    maxAge: 40,
    weight: 2,
    apply: (player) => player.addLog('A friend sent me a stream of ridiculous emails. Some were actually funny.', ['friend']),
  },
  {
    id: 'car_incident',
    tags: ['danger'],
    minAge: 16,
    maxAge: 70,
    weight: 1,
    apply: (player) => {
      player.modifyStat('health', -10);
      player.modifyStat('happiness', -6);
      if (chance(0.1)) {
        player.addLog('I barely survived a car accident. Life feels fragile.', ['danger']);
      } else {
        player.addLog('Someone crashed into the car ahead of me. Close call!', ['danger']);
      }
    },
  },
  {
    id: 'acne',
    tags: ['health'],
    minAge: 12,
    maxAge: 18,
    weight: 3,
    apply: (player) => {
      player.modifyStat('looks', -5);
      player.addLog('My acne decided to stage a coup on my face.', ['teen']);
    },
  },
  {
    id: 'highschool_grad',
    tags: ['education'],
    minAge: 17,
    maxAge: 19,
    weight: 2,
    condition: (player) => player.education.currentLevel === 'high' && player.education.yearsInCurrentLevel >= 4,
    apply: (player) => {
      player.education.currentLevel = 'high';
      player.education.completedHighSchool = true;
      player.addLog('I graduated from high school!', ['education']);
    },
  },
  {
    id: 'supportive_partner',
    tags: ['relationships'],
    minAge: 18,
    maxAge: 80,
    weight: 2,
    condition: (player) => player.relationships.some((r) => r.romantic > 40),
    apply: (player) => {
      player.modifyStat('happiness', 6);
      player.addLog('My partner supported me through a rough patch this year.', ['relationships']);
    },
  },
  {
    id: 'child_laughter',
    tags: ['family'],
    minAge: 26,
    maxAge: 70,
    weight: 1,
    condition: (player) => player.relationships.some((r) => r.relationshipType === 'child'),
    apply: (player) => player.addLog('My kid told a joke so bad it looped around and became legendary.', ['family']),
  },
  {
    id: 'inheritance',
    tags: ['finance'],
    minAge: 25,
    maxAge: 70,
    weight: 0.6,
    apply: (player) => {
      const amount = 5000 + Math.floor(Math.random() * 20000);
      player.modifyMoney(amount);
      player.addLog(`A distant relative left me an inheritance of $${amount.toLocaleString()}.`, ['finance']);
    },
  },
];

export const pickIllnessEvent = (player) => {
  const possible = illnesses.filter((ill) => player.age >= ill.minAge && player.age <= ill.maxAge && !player.hasIllness(ill.id));
  if (!possible.length) return null;
  return {
    id: `illness_${possible[0].id}`,
    tags: ['health'],
    minAge: possible[0].minAge,
    maxAge: possible[0].maxAge,
    weight: 1,
    apply: (p) => {
      p.addIllness(possible[0].id);
      p.addLog(`I have been diagnosed with ${possible[0].name}.`, ['health']);
    },
  };
};

export default events;
