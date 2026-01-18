const f = require('./feature_list.json');
console.log('Total:', f.length);
console.log('Passing:', f.filter(x => x.passes).length);
console.log('Failing:', f.filter(x => !x.passes).length);
console.log('\nFailing features:');
f.filter(x => !x.passes).forEach((x, i) => console.log(i+1 + '. ' + x.description.substring(0, 80) + '...'));
