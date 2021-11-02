/**
 * Define a **f**eatured **f**unction inside the menu system.
 * Function definitions only allowed with this **ff** global variable.
 */
declare const ff: IFF;

/**
 * **jj** used for jji menu modifier.
 * you can control and access some functions to manage your workflow inside your **ff** functions.
 */
declare const jj: IJJ;

declare interface IFF {
  /**
   * This type of function **have** to **return** a **sub menu**, but every select restarts a new Promise.
   *
   *  Do not use *menu* and *lazy menu* same time.
   */
  lazy: IFF;
  /**
   * This type of function **have** to **return** a **sub menu**.
   *
   * Do not use *menu* and *lazy* menu same time.
   */
  menu: IFF;
  /**
   * **noHeader** means when execute the command no header will be printed after the selection.
   *
   * **default**: *false*
   */
  noHeader: IFF;
  /**
   * **useIn** means if you want to use '`jj.rl`' function, input will be grabbed by node.
   * you can also manage manually inside yor function with `process.stdin.pause()` or `process.stdin.resume()`.
   *
   * **default**: *node not grab the inputs*
   */
  useIn: IFF;
  /**
   * **resetMenu** means if you want a repositioned menu.
   * if you print anything to screen during the menu build, the default work flow clears back last menu size.
   * works only with lazy menu.
   *
   * [default]: *clear back the last menu size*
   */
  resetMenu: IFF;
  /**
   * **printSelect** means if you want to print the selection header on menu enter.
   * works only with lazy menu.
   *
   * **default**: *no header print*
   */
  printSelect: IFF;
  /**
   * **header** means print message before menu execute [example/real/jj.js#L26](example/real/jj.js#L26).
   * you can use `jj.term.colorCode*` [src/term.js#L237](src/term.js#L237)
   * @param fn return **string**
   */
  header(fn: () => any): IFF;
  /**
   * **showLoadingAfter** means lazy menu will not print the loading immediately.
   * [default]: *100*
  
   * @param ms number ms 
   */
  showLoadingAfter(ms: number): IFF;
  /**
   * **footer** means print message after menu execute [example/real/jj.js#L26](example/real/jj.js#L26).
   * you can use `jj.term.colorCode*` [src/term.js#L237](src/term.js#L237)
   * @param fn return **string**
   */
  footer(fn: () => any): IFF;
  /**
   * **home** means after the function finish jji will reopen the menu on the top (root) level.
   */
  home: IFF;
  /**
   * **stay** means after the function finish jji will reopen the menu on same level.
   */
  stay: IFF;
  /**
   * define what you want to **do** inside **ff** function declaration.
   *
   * @param fn - sync or async function
   */
  do(fn: () => any): IFF;
}

/**
 * **jji** used for menu modifier.
 * you can control and access some functions to manage your workflow inside your **jj** functions.
 */
declare interface IJJ {
  /**
   * **rl** means read a line from stdin: `const rl = await jj.rl('Type your name')`.
   *
   * @param question - string
   */
  rl(question: string): string;

  /**
   * **err** will print an error msg if exist and exit the program.
   *
   * @param msg - message string
   */
  err(msg: string): any;
  /**
   * **mkdir** will create a folder recursively.
   *
   * @param path - string
   */
  mkdir(path: string): any;
  /**
   * **rm** will remove a folder recursively.
   *
   * @param path - string
   */
  rm(path: string): any;
  /**
   * **command line:** execute external **script**, inside spawn.
   * **cl** means start spawn with inherited stdio.
   *
   * finalize the script call the **do** function at *last* position.
   *
   */
  cl: ICL;
  /**
   * **interpreted command line:** execute external **script** which is **interpreted** into **string**, inside spawn.
   * **cli** means start spawn, stdout and stderr will be parsed.
   *
   * finalize the script call the **do** function at *last* position.
   *
   */
  cli: ICLI;
}

declare interface ICL {
  /**
   * **noErr** means the output will not contains stderr output
   */
  noErr: ICL;
  /**
   * **wd** means set the process working directory
   * @param wd path to working directory
   */
  wd(wd: string): ICL;
  /**
   * **eol** set end of line characters
   *
   * **default**: '\n'
   * @param eol end of line characters
   */
  eol(eol: string): ICL;
  /**
   * **do** means spawn the command
   */
  do(commandLine: string);
}

declare interface ICLI extends ICL {
  /**
   * **splitByLine** means the output will be split by line
   */
  splitByLine: ICLI;
  /**
   * **splitAll** means the output will be split by line and split lines by [space || tab]
   */
  splitAll: ICLI;
}
