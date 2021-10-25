# jji

**J**ust a simple **J**umper cl**I** tool.

This tool aims to make an easy menu system to organize your cli workflow.
* Just run `jj` if you have only one `jj.js` file in the current folder or `jj script.jj.js`.

# Install 
* ```npm i -g jji```

# How menu structure works
* every menu item has name: `module.export.test`
* every menu item has command which can be: `string`, `function` or `null`
* every menu item optionally can have a description. in this case the definition change to array where description is on the first place: `module.exports.run = ["run simple", "echo hello"]`
* every menu item (**this** type of menu **is a group**) can have sub menu which can be after description or after command
  * after description: `module.exports.run = ["run simple", {...}]`
  * after command: `module.exports.run = ["run simple", "echo hello", {...}]`
* every group can have a group command which can be: `string`
* when one item selected, all group command and item command going to concat into one string and executed in **node spawn** shell
* there are 3 extra type of menu item:
  * **lazy** load menu, which means when you enter into the menu the Promise start after the select
  * **later** load menu, which means the Promise start after the program start
  * **read only** not selectable menu item (in this case the menu command is null)

# Examples
* [example/demo/jj.js#L1](example/demo/jj.js#L1)
* [example/real/jj.js#L1](example/real/jj.js#L1)

# Features
* possible to run script from `jj.js` or `*.jj.js`
* if the working folder contains *.jj.js possible to sort with number. ex. *.0.jj,js *.1.jj,js
* prompt base sub menu system, please check the [example/demo/jj.js#L1](example/demo/jj.js#L1)
* search in the menu (in the name and description)
* all **script runs** inside a **node spawn**
* provided **global functions**, which means you **do not need to import anything** for use in your jj.js file:
  * '`_`': which run a simple script. The output simple printed:``_`echo hello wold` ``. possible to combine with fix parameter between array. `_(``docker exec alpine sh -c``, [``ls -al``]);` or `_(``docker exec alpine sh -c``, [``ls -al``], ``/usr``, [``/path with space``]);`
  * '`__`' which run a simple script. same as `_`, but output is not printed and parsed. Example:`` const a = await __`echo other done other`; console.log(a) ``. [default]: *no split*. Possible to add extra parameters (option object place in the arguments list no matter):
    * **__splitByLine**: the output will not be split: `await __(``hi ${false}``, { __splitByLine: true }, 'other');` [example/demo/jj.js#L81](example/demo/jj.js#L81)
    * **__splitAll**: the output will be split by line and split lines by [space and tab]: `await __(``hi ${false}``, { __splitAll: true });` [example/demo/jj.js#L77](example/demo/jj.js#L77)
  * '`$`' for a later load menu, which means the Promise start after the program start. First parameter is a promise call back function, the second is  a description, the third is a command. Example:`$((res, rej)=>{}, {options})`
  * '`$$`' for a lazy load menu, which means when you enter into the menu the Promise start after the enter. First parameter is a promise call back function, the second is  a description, the third is a command. Example:`$$((res, rej)=>{}, {options})`
  * '`$$$`' for a option extend, which means only the extra options extends the original function. Example:`$$$((res, rej)=>{}, {options})`
  * all command which are functions, can have options:
    * **__noPrintOnSelect** [boolean] **true** means when execute the command no header will be printed after the selection. [example/real/jj.js#L33](example/real/jj.js#L33). [default]: *false*
    * **__needInput** [boolean] **true** if you want to use '`jj.rl`' function. you can also manage manually inside yor function with `process.stdin.pause()` or `process.stdin.resume()`.  [example/demo/jj.js#L13](example/demo/jj.js#L13). [default]: *false*
    * **__showLoadingAfter** [number] **ms** works only with lazy menu [example/real/jj.js#L33](example/real/jj.js#L33). [default]: *100*
    * **__resetMenuPos** [boolean] **true** if you want a repositioned menu. if you print anything to screen during the menu build, the default work flow clears back last menu size. works only with lazy menu [example/demo/jj.js#L105](example/demo/jj.js#L105). [default]: *false*
    * **__header** [function] **returns string** print message before menu execute [example/real/jj.js#L27](example/real/jj.js#L27). you can use `jj.term.colorCode*` [src/term.js#L237](src/term.js#L237)
    * **__footer** [function] **returns string** print message after menu execute [example/real/jj.js#L28](example/real/jj.js#L28). you can use `jj.term.colorCode*` [src/term.js#L237](src/term.js#L237)
    * **__keyHandler** [function] when **returns true** menu can handle that key. [default]: *undefined*
  * `jj` for a jj global function access. In your javascript code you van use the followings:
    * '`jj.home()`' which will reopen the menu on the top (root) level after the function finish
    * '`jj.stay()`' which will reopen the menu on the same level after the function finish
    * '`jj.rl`': `const rl = await jj.rl('Type your name')` which will read a line from stdin. One parameter is the question.
    * '`jj.err`': `jj.err('Something went wrong!')` this will print an error msg if exist and exit the program.
    * '`jj.mkdir`': `await jj.mkdir('/path/to')` this will create a folder recursively.
    * '`jj.rm`': `await jj.rm('/path/to')` this will remove a folder recursively.
  * all boolean property is available on global scope because of shorter definition. example: `await __(``hi ${false}``, { __splitByLine: true }, 'other');` ==> `await __(``hi ${false}``, { __splitByLine }, 'other');`

* menu control keys:
  * **arrow-up/down and tab**: up/down in the menu
  * **select**: enter
  * **one level up**: esc
  * **on top level**: esc equals exit
  * **terminate**: ctrl+c
  * **clear screen**: ctrl+l

# Examples

Examples are located in [example](example/demo/jj.js).

# Usage

| command        | description|
| ------------- |:-------------|
| *jj* | it gives a nice *choices* menu |
| *jj --help* | gives a standard help manual|


# Status

* [x] support menu for select a script
* [ ] support sequential run
* [ ] support parallel run
