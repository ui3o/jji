# jji

**J**ust a simple **J**umper cl**I** tool.

This tool aims to make an easy menu system to organize your cli workflow.
* Just run `jj` if you have only one `jj.js` file in the current folder or `jj script.jj.js`.

# Install 
* ```npm i -g jji```
* Install [Cygwin](https://www.cygwin.com/) on Windows! see [here](#Dependencies)

# Motivation
* cross platform (windows and linux) script in `jj.js` because of Cygwin.
* resolves
    * environment variable, possible to use only process.env.ENV_VAR, no longer need on %ENV_VAR% on window
    * possible to use same command on windows and linux with [Cygwin](https://www.cygwin.com/)


# Features

* possible to run script from `jj.js` or `*.jj.js` files.
* prompt base submenu system, please check the [example/jji.js#1](example/jji.js#1)
* search in the menu (in the name and description)
* all **script runs** inside a *bash* shell
* provided global functions:
  * `_` which run a simple script. The output simple printed:`` _`echo hello wold` ``
  * `__` which run a simple script, but output is not printed and parsed. examples:`` const a = __`sleep 3 && echo done && echo other done other`; console.log(a[0][0]) ``
  * `$` for a later load menu. First parameter is a description, the second is a promise call back function. example:`$('description', (res, rej)=>{})`
  * `$$` for a later load menu. First parameter is a description, the second is a command, the third is a promise call back function. example:`$('description', (res, cmd rej)=>{})`
* menu control keys:
  * **select**: enter
  * **one level up**: esc
  * **on top level**: esc equals exit
  * **terminate**: ctrl+c

# Examples

Examples are located in [example](example/jj.js).

# Dependencies

* Install [Cygwin](https://www.cygwin.com/)
* **IMPORTANT!! Add** Cygwin **path** to **Environment** variables to **top** level, which replace the default windows commands like find and etc.

![Alt text](/docs/windows_settings.png?raw=true)

# Usage

| command        | description|
| ------------- |:-------------|
| *jj* | it gives a nice *choices* menu |
| *jj --help* | gives a standard help manual|


# Status

* [x] support menu for select a script
* [ ] support sequential run
* [ ] support parallel run
