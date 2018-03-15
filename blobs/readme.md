# Project Blobs

## Current details of implementation:

- `genCombinations1` means "generator of all combinations on 1 dimension"
and `genCombinations2` is for "generator of all combinations of 2 dimensions"
- In `genCombinations1`, elements in the output set are sorted.  
- In `genCombinations2`, elements in the output set are sorted by the first subelement (`[0,...]` will be first, `[1,...]` second etc...).  

Examples of uses:
    
`genCombinations2([0,1,2,3,4,5,6], 3, 2);` should yield:
1- `[[0,1],[2,3],[4,5]]`
2- `[[0,1],[2,3],[4,6]]`
3- `[[0,1],[2,3],[5,6]]`
4- `[[0,1],[2,4],[5,6]]`
5- `[[0,1],[2,5],[4,6]]`
6- `[[0,1],[2,6],[4,5]]`
7- `[[0,1],[3,4],[5,6]]`
 ...
105- `[[1,2],[3,4],[5,6]]`
 
`genCombinations1([0,1,2,3,4], 4);` should yield:
1- `[0,1,2,3]`
2- `[0,1,2,4]`
3- `[0,1,3,4]`
4- `[0,2,3,4]`
5- `[1,2,3,4]`

## Technicals

For `genCombinations2(Set, T, S)`, number of output will be:
- `P! / T! / S!^T / (P-TS)!`
- With `P` the number of blobs to combine
- With `T` the number of teams to have at each round
- With `S` the number of blobs in each teams

## Constraints 

- I don't want to generate all combinations and store them to an array before using them (sometimes my software will ask for combinations over more than 20 elements, that make more than `102,866,828,839` combinations so DO NOT store them all in an array)
- `genCombinations1` output should never contains 2 (or more) times the same element (`[...,4,...,4,...]` is not accepted); 0 times is allowed.
- `genCombinations2` output should not have 2 (or more) subsets containing the same subelement (`[[...,4,...],[...,4,...]]` is illegal as `4` is present more than 1 time in the output).; an element can be not present.
- `genCombinations1` cannot yields 2 times the same output set, but all combinations should been yield.
- `genCombinations2` cannot yields 2 times the same output set, but all combinations should been yield (note that `[[1,2],[3,4]]` is the same subset as `[[2,1],[4,3]]` and `[[3,4],[1,2]]` ...).
- I work with **Javascript** (ES6) **WITHOUT libraries**. This program is for own learning and not for any commercial purposes

# Credits

Nathaël Noguès, 2018-01-05