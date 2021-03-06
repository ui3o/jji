# jji

**J**ust a simple **J**umper cl**I** tool.

This tool aims to make an easy menu system to organize your cli workflow.
* Just run `jj` if you have only one `jj.js` file in the current folder or `jj script.jj.js`.

# Install 
* ```npm i -g jji```

# How menu structure works
* every menu item has name: `module.export.test`
* every menu item has command which can be: `string`, `featured function` or `null`
* every menu item optionally can have a description. in this case the definition change to array where description is on the first place: `module.exports.run = ["run simple", "echo hello"]`
* every menu item (**this** type of menu **is a group**) can have sub menu which can be after description or after command
  * after description: `module.exports.run = ["run simple", {...}]`
  * after command: `module.exports.run = ["run simple", "echo hello", {...}]`
* every group can have a group command which can be: `string`
* when one item selected, all group command and item command going to concat into one string and executed in **node spawn** shell
* there are 3 extra type of menu item:
  * **lazy** load menu, which means when you enter into the menu the Promise start after the select
  * **slow** menu, which means the Promise start after the program start
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
* provided **global functions**, which means you **do not need to import anything** for use in your *.jj.js file:
  * '`jj.cl.do`': which run a simple script. The output simple printed:``jj.cl.do`echo hello wold` ``. possible to combine with fix parameter between array. `jj.cl.do(``docker exec alpine sh -c``, [``ls -al``]);` or `jj.cl.do(``docker exec alpine sh -c``, [``ls -al``], ``/usr``, [``/path with space``]);`
  * '`jj.cli.do`' which run a simple script. same as `jj.cl`, but output is not printed and parsed. Example:`` const a = await jj.cli.do`echo other done other`; console.log(a) ``. [default]: *no split*. Possible to add extra parameters (option object place in the arguments list no matter):
    * **splitByLine**: the output will not be split: `await __(``hi ${false}``, { __splitByLine: true }, 'other');` [example/demo/jj.js#L76](example/demo/jj.js#L76)
    * **splitAll**: the output will be split by line and split lines by [space and tab]: `await __(``hi ${false}``, { __splitAll: true });` [example/demo/jj.js#L84](example/demo/jj.js#L84)
    * **hideStdErr**: the output will not contains stderr output: `await __(``hi ${false}``, { __hideStdErr }, 'other');`. [default]: *include*
    * **wd**: set the current directory: `await __(``hi ${false}``, { __cwd:'/path to repo' }, 'other');`. [default]: *undefined*
    * **eol**: set end of line characters: `await __(``hi ${false}``, { __eol:'\r\n' }, 'other');`. [default]: *\n*
  * '`ff.lazy.do`' for a lazy load menu, which means when you enter into the menu the Promise start after the enter. First parameter is a promise call back function, the second is  a description, the third is a command. Example:`ff.lazy.do(async (res)=>{}, {options})`
  * '`$`' for a option extend, which means extra options extends the original function. Example:`$$$((res, rej)=>{}, {options})`
  * all command which are functions, can have options:
    * **__noPrintOnSelect** [boolean] **true** means when execute the command no header will be printed after the selection. [example/real/jj.js#L50](example/real/jj.js#L50). [default]: *false*
    * **__needInput** [boolean] **true** if you want to use '`jj.rl`' function. you can also manage manually inside yor function with `process.stdin.pause()` or `process.stdin.resume()`.  [example/demo/jj.js#L14](example/demo/jj.js#L14). [default]: *false*
    * **__showLoadingAfter** [number] **ms** works only with lazy menu [example/real/jj.js#L31](example/real/jj.js#L31). [default]: *100*
    * **__resetMenuPos** [boolean] **true** if you want a repositioned menu. if you print anything to screen during the menu build, the default work flow clears back last menu size. works only with lazy menu [example/demo/jj.js#L114](example/demo/jj.js#L114). [default]: *false*
    * **__printSelect** [boolean] **true** if you want a selection on menu enter. works only with lazy menu [example/demo/jj.js#L20](example/demo/jj.js#L20). [default]: *false*
    * **__header** [function] **returns string** print message before menu execute [example/real/jj.js#L25](example/real/jj.js#L25). you can use `jj.term.colorCode*` [src/term.js#L237](src/term.js#L237)
    * **__footer** [function] **returns string** print message after menu execute [example/real/jj.js#L26](example/real/jj.js#L26). you can use `jj.term.colorCode*` [src/term.js#L237](src/term.js#L237)
    * **__keyHandler** [function] when **returns true** menu can handle that key. *not implemented yet* [default]: *undefined*
  * `jj` for a jj global function access. In your javascript code you can use the followings:
    * '`jj.home()`' which will reopen the menu on the top (root) level after the function finish
    * '`jj.stay()`' which will reopen the menu on the same level after the function finish
    * '`jj.rl`': `const rl = await jj.rl('Type your name')` which will read a line from stdin. One parameter is the question.
    * '`jj.err`': `jj.err('Something went wrong!')` this will print an error msg if exist and exit the program.
    * '`jj.mkdir`': `await jj.mkdir('/path/to')` this will create a folder recursively.
    * '`jj.rm`': `await jj.rm('/path/to')` this will remove a folder recursively.
  * all boolean property is available on global scope because of shorter definition. example: `await __(``hi ${false}``, { __splitByLine: true }, 'other');` ==> `await __(``hi ${false}``, { __splitByLine }, 'other');`
  * global control properties for jji workflow:
    * **process.env.__shell** [boolean] **true** means all spawn command will be executed in shell.


* menu control keys:
  * **arrow-up/down and tab**: up/down in the menu
  * **select**: enter
  * **one level up**: esc
  * **on top level**: esc equals exit
  * **terminate**: ctrl+c
  * **clear screen**: ctrl+l
  * **fly mode start**: ctrl+space or text start with space

# Examples

Examples are located in [example](example/).

# Usage

| command        | description|
| ------------- |:-------------|
| *jj* | it gives a nice *choices* menu |
| *jj --help* | gives a standard help manual|


# Status

* [x] support menu for select a script
* [x] fly mode
