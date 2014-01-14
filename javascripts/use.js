
// var lv1 = new Validation('lv1');
// lv1.add('presence');
Validation.add('#lv1', 'presence')

var lv2 = new Validation('#lv2', {onlyOnBlur: true});
lv2.add('presence numericality');

var lv3 = new Validation('#lv3');
lv3.add('numericality', {onlyInteger: true});

var lv4 = new Validation('#lv4');
lv4.add('numericality', {is: 5});

var lv5 = new Validation('#lv5');
lv5.add('numericality', {min: 5});

var lv6 = new Validation('#lv6');
lv6.add('numericality', {max: 5});

var lv7 = new Validation('#lv7');
lv7.add('numericality', {min:3, max:9});

var lv8 = new Validation('#lv8');
lv8.add('numericality', {min:20, max:30, onlyInteger:true});

var lv9 = new Validation('#lv9');
lv9.add('size', { is: 4 } );

var lv10 = new Validation('#lv10');
lv10.add('size', { min: 4 } );

var lv11 = new Validation('#lv11');
lv11.add('size', { max: 4 } );

var lv12 = new Validation('#lv12');
lv12.add('size', { min:5, max: 10 } );

var lv13 = new Validation('#lv13');
lv13.add('format', { pattern: /love/i } );

var lv14 = new Validation('#lv14');
lv14.add( 'inclusion', { within: ['apple', 'banana', 'orange'] } );

var lv15 = new Validation('#lv15');
lv15.add( 'inclusion', { within: ['apple', 'banana', 'orange'], partialMatch: true } );

var lv16 = new Validation('#lv16');
lv16.add( 'exclusion', { within: ['apple', 'banana', 'orange'] } );

var lv17 = new Validation('#lv17');
lv17.add( 'exclusion', { within: ['apple', 'banana', 'orange'], partialMatch: true } );

var lv18 = new Validation('#lv18');
lv18.add( 'acceptance' );

var lv19 = new Validation('#lv19');
lv19.add( 'confirmation', { match: 'myPassword' } );

var lv20 = new Validation('#lv20');
lv20.add( 'email' );

var zv20Obj = new Validation('#lv21')
zv20Obj.add('presence')
zv20Obj.add('chinese')

var zv22Obj = new Validation('#lv22')
zv22Obj.add('mobile')
