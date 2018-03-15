# Project Reduce

## Get word scores

Goal is to find the longest and more repetitive part of a string in a bigger string, given a function that give a number of points depending on string size and occurences in the text

## Reduce

Goal is to reduce the size of a string, replacing recurring part with new symbols.

### No loose compress technic

First, we get all reccurring part in the string.  
We calculate for each the compression value, then choosing the better one (all that are more than 0 characters reduced)

We get a new character that is not in the original text, and replacing everywhere the part we choose by this new character.  
We add the part, the character replacing, and a separator (another character not in the original text) to the beginning of the replaced text so that we can decode the text later

We can repeat this step until having replaced all interesting part of the text (all that have compression value > 0)

### Compression value

For any replacement following this algorithm, we have the following compression:

With:
- `R` is the number of characters less in output than in input
- `L` is the number of characters of the part to replace
- `O` is the occurrence of the part to replace in the original string

The equation is: `R = (L-1)*(O-1) -3`

#### Example:

Replacing `abcd` by `e` in `aababcabcdabcdabcdabcdbcdcdd` (length 28)  
Using `f` as a separator, the output will be: `abcdefaababceeeebcdcdd` (length 22)

Compression value is `28-22` = `6`

Example to calculate this compression value using the formula:  
L = `4`  
O = `4`  
R = `(4-1)*(4-1) -3` = `3*3-3` = `9-3` = `6`

The output is 6 character shorter than the original text.  
Original length was `28`, reduced will be `28-6` = `22`
