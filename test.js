const players = [{id: undefined}, {id: undefined}, {id: undefined}];
const lineup = [{player: {id: undefined}}];
const available = players.filter(p => !lineup.find(l => l.player.id === p.id));
console.log(available.length);
