cns('S',strong).
cns('Z',weak).
cns('K',strong).
cns('G',weak).
cns('T',strong).
cns('D',solo).
cns('M',solo).
cns('N',solo).
cns('P',strong).
cns('B',weak).
cns('X',solo).
cns('H',solo).
cns('C',strong).
cns('J',weak).
cns('F',strong).
cns('V',weak).
cns('R',solo).
cns('L',solo).
cns2(X) :- cns(X, _).
cns2(X) :- cns(A,weak), cns(B,weak), A\=B, atom_concat(A, B, X).
cns2(X) :- cns(A,strong), cns(B,strong), A\=B, atom_concat(A, B, X).

vow('A').
vow('E').
vow('Ou').
vow('I').
vow('O').
vow('U').
vow('Eu').
vow('On').
vow('An').
vow('In').
vow2(X) :- vow(X).
vow2(X) :- vow(A), vow(B), A\=B, atom_concat(A, B, X).

syl(S) :- cns2(C), vow2(V), atom_concat(C, V, S).

sylgrp(Sg, 1) :- syl(Sg).
sylgrp(Sg, C) :- C > 1, D is C-1, syl(B), sylgrp(A, D), atom_concat(A, B, Sg). % éviter les words de plus de 4 syls

word(_, B) :- sylgrp(B, 1).
word(_, B) :- sylgrp(B, 2).
word(_, B) :- sylgrp(B, 3).
word(_, B) :- sylgrp(B, 4).
word(_, B) :- sylgrp(B, 5).

dictfind(O,D,[Od,Dd]) :- dictfind(O, D, Od, Dd).
dictfind(O,D,[O], [D]) :- word(O, D).
dictfind(O,D,[O|_], [D|_]) :- word(O, D).
dictfind(O,D,[A|Od], [B|Dd]) :- O \= A, dictfind(O,D,Od,Dd), D \= B.

sentense([S],[R], Dict) :- dictfind(S,R, Dict).
sentense([S|Ss],[R|Rr], Dict) :- dictfind(S,R, Dict), sentense(Ss, Rr, Dict).

sentenses([O], [N], Dict) :- sentense(O,N,Dict).
sentenses([O|Ro], [N|Rn], Dict) :- sentense(O,N,Dict), sentenses(Ro,Rn,Dict).

prettydict([],[],[]).
prettydict([O1|Or],[D1|Dr]) :- prettydict(Or,Dr).

ddict(O,D) :- sentenses([
	['cat', 'food', '+active', 'while', 'mouse', 'food', '+passive', 'while', '(endGroup)'],
	['mouse', 'food', '+passive'],
	['cat', 'food', '+active', 'while', '(implicit)'],
	['and', 'dog', '(group)', 'cat', 'big', '(group)', '(endGroup)', 'mouse', 'and', '(endGroup)'],
	['description', '1', 'short', 'of', 'property', 'all', 'of', '(endGroup)', 'change', '+passive', '+imperative', '+future', 'during', 'installation', 'process', 'the', 'during', '(endGroup)', 'list', '+passive', 'below'],
	['cat', '4', '10', '2', 'be', '+passive'],
	['cat', '(nth)', '4', '10', '2', 'be', '+passive']
], _, [O,D]).
