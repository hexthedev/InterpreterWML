//James McCafferty 260 638 883 COMP 302


// Brackets. TSTART and TEND use negative lookahead to catch cases of {{{ or }}}
var TSTART = new RegExp("{{(?!{)");
var TEND = new RegExp("}}(?!})");

var DSTART = new RegExp("{:");
var DEND = new RegExp(":}");

var PSTART = new RegExp("{{{");
var PEND = new RegExp("}}}");

//TEXT. [^] is not anything. [\r\n\t\f\v ] is white space tokens. I tried using stuff like [\s] for whitespace but got bugs. Basically the Regex below is pretty verbose, but this has been the most stable build.
var OUTERTEXT = new RegExp("(([^]|[\r\n\t\f\v ])(?!{{|{:))*(.|[\r\n\t\f\v ])");
var INNERTEXT = new RegExp("(([^]|[\r\n\t\f\v ])(?!{{|}}|{:|\\|))*(.|[\r\n\t\f\v ])");
var INNERDTEXT = new RegExp("(([^]|[\r\n\t\f\v ])(?!{{|{:|:}|\\|))*(.|[\r\n\t\f\v ])");

//NAME. Same verboseness as TEXT
var DNAME = new RegExp("(([^]|[\r\n\t\f\v ])(?!\\|))*(.|[\r\n\t\f\v ])");
var PNAME = new RegExp("(([^]|[\r\n\t\f\v ])(?!}}}|\\|))*(.|[\r\n\t\f\v ])");   

//OTHER
var PIPE = new RegExp("[|]");