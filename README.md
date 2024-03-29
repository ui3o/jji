# jji

**J**ust a simple **J**umper cl**I** tool.

This tool aims to make an easy menu system to organize your cli workflow.

Just run `jj` if you have `jj.js` file or `*.jj.js` files in the current folder.

# Install 

```npm i -g jji```

# How menu structure works

* every menu item has name: `module.export.test`
* every menu item has command which can be: `ss` - *simple script*, `ff` - *featured function* or `null`
* every menu item optionally can have a description. in this case the definition change to array where description is on the first place: `module.exports.run = ["run simple", ss("echo hello")]`
* every menu item can have sub menu which can be after description or after command (it called as **group**)
  * after description: `module.exports.group_name = ["group description", {...}]`
  * after command: `module.exports.group_name = ["group description", ss("echo hello"), {...}]`
* every group can have a group command which can be: `ss` - *simple script*
* when one item selected, all group command and item command going to be concatenated into one string and executed in **node spawn** shell
* there are 3 extra type of menu item:
  * **lazy** load menu - `ff.lazy.do(async (resolve)=>{...})`, which means when you enter into the menu the Promise start after the select
  * **slow** menu - `ff.menu.do(async (resolve)=>{...})`, which means the Promise start after the program start
  * **read only** - `null`, not selectable menu item

# Examples

* [example/demo/jj.js#L1](example/demo/jj.js#L1)
* [example/real/jj.js#L1](example/real/jj.js#L1)

# Menu control keys

* **arrow-up/down and tab**: up/down in the menu
* **select**: enter
* **one level up**: esc
* **on top level**: esc equals exit
* **terminate**: ctrl+c
* **clear screen**: ctrl+l
* **fly mode start**: ctrl+space or text start with space

# Features

* possible to run script from `jj.js` or `*.jj.js`
* if the working folder contains `*.jj.js` possible to sort with number. ex. `*.0.jj,js` `*.1.jj,js`
* prompt base sub menu system, please check the [example/demo/jj.js#L1](example/demo/jj.js#L1)
* search in the menu and in descriptions
* all **script runs** inside a **node spawn**
* provided **global functions**, which means you **do not need to import anything** for use in your `*.jj.js` file:
  * **ss** - *simple script*
  * **ff** - *featured function*
  * **jj** - *just jump* extra functions

### Global functions
##### ss - *simple script*
##### ff - *featured function*
##### jj - *just jump* extra functions

`jj` for a jj global function access. In your javascript code you can use the followings:

  * '`jj.home()`' which will reopen the menu on the top (root) level after the function finish
  * '`jj.stay()`' which will reopen the menu on the same level after the function finish
  * '`jj.rl`': `const rl = await jj.rl('Type your name')` which will read a line from stdin. One parameter is the question.
  * '`jj.err`': `jj.err('Something went wrong!')` this will print an error msg if exist and exit the program.
  * '`jj.mkdir`': `await jj.mkdir('/path/to')` this will create a folder recursively.
  * '`jj.rm`': `await jj.rm('/path/to')` this will remove a folder recursively.
  * `jj.cl*.do` which run a simple script:
    * global control properties for jji workflow:
      * **process.env.__shell** [boolean] **true** means all spawn command will be executed in shell.
    * '`jj.cl.do`': which run a simple script with inherited stdio. The output simple printed:``jj.cl.do(`echo hello wold`) ``. possible to combine with fix parameter between array. `jj.cl.do(``docker exec alpine sh -c``, [``ls -al``]);` or `jj.cl.do(``docker exec alpine sh -c``, [``ls -al``], ``/usr``, [``/path with space``]);`
    * '`jj.cli.do`' which run a simple script. same as `jj.cl`, but *output* is not printed and *parsed*. Example:``const a = await jj.cli.do(`echo other done other`); console.log(a)``. [default]: *no split*. Possible to add extra parameters (option object place in the arguments list no matter):
      * **splitByLine**: the output will not be split: `await jj.cli.splitByLine.do(``echo ${false}``, 'other');` [example/demo/jj.js#L76](example/demo/jj.js#L76)
      * **splitAll**: the output will be split by line and split lines by [space and tab]: `await jj.cli.splitAll.do(``echo ${false}``, );` [example/demo/jj.js#L84](example/demo/jj.js#L84)
      * **hideErr**: the output will not contains stderr output: `await jj.cli.hideErr.do(``echo ${false}``, 'other');`. [default]: *include*
      * **wd**: set the current directory: `await jj.cli.wd('/path/to').do(``echo ${false}``, 'other');`. [default]: *undefined*
      * **eol**: set end of line characters: `await jj.cli.eol('\r\n').do(``echo ${false}`` 'other');`. [default]: *\n*
  
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
  
  * all boolean property is available on global scope because of shorter definition. example: `await __(``hi ${false}``, { __splitByLine: true }, 'other');` ==> `await __(``hi ${false}``, { __splitByLine }, 'other');`


# Usage

| command        | description|
| ------------- |:-------------|
| *jj* | it gives a nice *choices* menu |
| *jj -h* | gives a standard help manual|

# Status

* [x] support menu for select a script
* [x] fly mode
