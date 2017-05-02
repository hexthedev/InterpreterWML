//James McCafferty 260 638 883 COMP 302

//So the parser ends up being relatively complex. I think this was expected, since the program is rather complex and there are a lot of little edge cases that need dealing with. I understand that some parts of my code may be hard to interpret without understanding the whole program but I have tried to comment everything so you can understand. I hope my comments help. 


function parseOuter(s){
    
    //Tokens that are relevent to the parseOuter. 
    var outerTokens = {TSTART:true, DSTART:true, OUTERTEXT:true};
    
    //pOuterRecurse, this is probably unnecessary, but I like having my recursion inside a separate function inside the main function. Basically, this will do all the work.  
    function pOuterRecurse(newS){
        
        //token = the token returned from the scan. 
        var token = scan(newS, outerTokens);        
        
        //Set up the AST node that will be created. 
        var ASTnode = {name: 'outer', OUTERTEXT: null, templateinvocation: null, templatedef: null, next:null, length:null};
        
        //Scan returns 'NO MATCH' if the scanner does not find a token. Upon scanner returning no match, instead of returning as AST node we return null. 
        if(token === 'NO MATCH'){
            return null;
        }         
        
        //This switch looks at the cariable token, then looks up the token name. 
        switch(token['token']){
            //In the case of TSTART, We need to parse a template invocation in our ASTnode, at key 'templateinvocation'. After that, our ASTnode's length = length of template invocation. Then, we recursively parseAgain, but this time starting from the point in the string passed the template invocation we just parsed. hence the newS.slice(ASTnode['length'])
            case 'TSTART': 
                ASTnode['templateinvocation'] = parseTemplateInvocation(newS);
                ASTnode['length'] = ASTnode['templateinvocation']['length'];
                ASTnode['next'] = pOuterRecurse(newS.slice(ASTnode['length']));
                break;
            //Same as above, only this time we are parsing for templatedef. 
            case 'DSTART': 
                ASTnode['templatedef'] = parseTemplateDef(newS);
                ASTnode['length'] = ASTnode['templatedef']['length'];
                ASTnode['next'] = pOuterRecurse(newS.slice(ASTnode['length']));
                break;
            //In the case of scanning outertext, we simply take the string value of our token. After this we set it's length. see comment below for isEnd explaination. 
            case 'OUTERTEXT': 
                ASTnode['OUTERTEXT'] = token['value'];
                ASTnode['length'] = ASTnode['OUTERTEXT'].length;
                
                //isEnd is a premptive scan after the outertext extracted above. It will be set to the token name of the token found in scanning. Below is an if statement. The point here is that, if OUTERTEXT is followed by more OUTERTEXT, this means that the first OUTERTEXT was parsed up until something in the negative lookahead of the OUTERTEXT regex. If the next scanned item if also outertext, then the next item in the string must appear in the negavite lookahead of the regEx for outertext. So the appropriate reaction is to return null, rather than continue parsing. Otherwise, the parse should continue.  
                var isEnd = scan(newS.slice(ASTnode['length']), outerTokens)['token'];
                 
                if(isEnd === 'OUTERTEXT'){
                    ASTnode['next'] = null;
                } else {
                    ASTnode['next'] = pOuterRecurse(newS.slice(ASTnode['length']));
                }                
                break;
        }        
        
        return ASTnode;
    }
    
    return pOuterRecurse(s);
}


function parseTemplateDef(s){
    //Set up AST node
    var ASTnode = {name: 'templatedef', dtext: null, xdtext: null, length: null};
    
    //Use checker function to assure that TemplateDef starts with DSTART token
    checker({DSTART:true}, "TEMPLATEDEFINITION ERROR: No DSTART", s);
    
    //Parse dtext after the DSTART token, hence s.slice(2). if null is returned, the dtext is empty, so length = 0, else length = length of new dtext node. 
    ASTnode['dtext'] = parseDText(s.slice(2));
    if(ASTnode['dtext']===null){
        var dLen = 0;
    } else {
        var dLen = getLength(ASTnode['dtext'], 0);
    }
        
    //Parse atleast 1 second dtext, Acts same as Parse dtext above.  
    ASTnode['xdtext'] = parseXtraDText(s.slice(2+dLen)); 
    if(ASTnode['xdtext']===null){
        var xLen = 0;
    } else {
        var xLen = getLength(ASTnode['xdtext'], 0);
    }

    //Use checker function to assure that TemplateDef ends with DEND token
    checker({DEND:true}, "TEMPLATEDEFINITION ERROR: No DEND", s.slice(2+dLen+xLen));
    
    //Total length = Length of dtext, Length of xdtext,{{ and }} (hence 4 + dLen + xLen)
    ASTnode['length'] = 4 + dLen + xLen;

    return ASTnode;
}

function parseTemplateInvocation(s){
    //Set up AST node
    var ASTnode = {name: 'templateinvocation', itext: null, targs: null, length: null};
    
    //Use checker function to assure that TemplateInvocation starts with TSTART token
    checker({TSTART:true}, "TEMPLATEINVOCATION ERROR: No TSTART", s);
      
    //Parse string after TSTART (hence s.slcie(2)), use getLength function to get length of parsed itext node. 
    ASTnode['itext'] = parseIText(s.slice(2));
    var iLen = getLength(ASTnode['itext'], 0);
    
    //Parse string after TSTART and above itext node (hence s.slice(2+iLen)). if no PIPE is present, then there are no arguments. if a PIPE is present, parse like itext above. 
    if(scan(s.slice(2+iLen),{PIPE:true})==='NO MATCH'){
            ASTnode['targs'] = null;
            var tLen = 0;
    } else {
            ASTnode['targs'] = parseTArgs(s.slice(2+iLen));
            var tLen =  getLength(ASTnode['targs'],0);
    }

    //Use checker function to assure that TemplateInvocation ends with TEND token
    checker({TEND:true, PEND:true}, "TEMPLATEINVOCATION ERROR: No TEND", s.slice(2+iLen+tLen));
    
    //Total length = Length of dtext, Length of xdtext,{{ and }} (hence 4 + iLen + tLen)
    ASTnode['length'] = 4 + iLen + tLen;
    
    return ASTnode;
}

// Parse XtraDText exists to deal with the situation of (| dtext)+ in <templatedefinition>
function parseXtraDText(s){
    // Set up ASTnode
    var ASTnode = {name: 'xdtext', dtext: null, next: null, length: null};
    
    // if the string passed here is empty, return null. 
    if(s.length === 0){
        return null;
    }
    
    // Make sure that the string passed in begining with PIPE
    checker({PIPE:true}, "XtraDText ERROR: No Pipe token", s);
        
    //Parse dtext after the PIPE hence (s.slice(1)). Parse dtext and place under dtext key. if dtext = null there is empty dtext, so set length to 0, otherwise set length to dtext length. 
    ASTnode['dtext'] = parseDText(s.slice(1));
    if(ASTnode['dtext']===null){
        var dLen = 0;
    } else {
        var dLen = getLength(ASTnode['dtext'],0);  
    }
    
    //set length of ASTnode to PIPE + dtext length. hence(1+ dLen)
    ASTnode['length'] = 1 + dLen;
    
    //Scan after current dtext. if this is equal to DEND, then no more dtext is avaible. Else, recursively parse the next dtext. 
    if(scan(s.slice(ASTnode['length']),{DEND:true})==='NO MATCH'){
        ASTnode['next']=parseXtraDText(s.slice(ASTnode['length']));  
    }
    
    return ASTnode;
}


function parseDText(s){
    //Tokens that require matching during Dtext parsing. 
    var DTextTokens = {TSTART:true, DSTART:true, PSTART:true, PIPE:true, DEND:true, INNERDTEXT:true};
    
    //Inner recursive function
    function pDTextRecurse(newS){
        
        //Find out what next token in string is. 
        var token = scan(newS, DTextTokens);
        
        //Set up ASTnode. 
        var ASTnode = {name: 'dtext', INNERDTEXT: null, templateinvocation: null, templatedef: null, tparam:null, next:null, length:null};
        
        //If there is no match, Dtext parsing has ended. Return null.
        if(token === 'NO MATCH'){
            return null;
        }
        
        //Use switch to determine what to do based on token. 
        switch(token['token']){
            //In the case of TSTART, We need to parse a template invocation in our ASTnode, at key 'templateinvocation'. After that, our ASTnode's length = length of template invocation. Then, we recursively parseAgain, but this time starting from the point in the string passed the template invocation we just parsed. hence the newS.slice(ASTnode['length'])
            case 'TSTART': 
                ASTnode['templateinvocation'] = parseTemplateInvocation(newS);
                ASTnode['length'] = ASTnode['templateinvocation']['length'];
                ASTnode['next'] = pDTextRecurse(newS.slice(ASTnode['length']));
                break;
            //Same as above
            case 'DSTART': 
                ASTnode['templatedef'] = parseTemplateDef(newS);
                ASTnode['length'] = ASTnode['templatedef']['length'];
                ASTnode['next'] = pDTextRecurse(newS.slice(ASTnode['length']));
                break;
            //Same as above
            case 'PSTART': 
                ASTnode['tparam'] = parseTParam(newS);
                ASTnode['length'] = ASTnode['tparam']['length'];
                ASTnode['next'] = pDTextRecurse(newS.slice(ASTnode['length']));
                break;
            //In the case of scanning INNERDTEXT, we simply take the string value of our token. After this we set it's length. see comment below for isEnd explaination. 
            case 'INNERDTEXT': 
                ASTnode['INNERDTEXT'] = token['value'];
                ASTnode['length'] = ASTnode['INNERDTEXT'].length;
                stripWhitespace(['INNERDTEXT'], ASTnode);       
                
                //isEnd is a premptive scan after the outertext extracted above. It will be set to the token name of the token found in scanning. Below is an if statement. The point here is that, if INNERDTEXT is followed by more INNERDTEXT, this means that the first INNERDTEXT was parsed up until something in the negative lookahead of the INNERDTEXT regex. If the next scanned item if also INNERDTEXT, then the next item in the string must appear in the negavite lookahead of the regEx for INNERDTEXT. So the appropriate reaction is to return null, rather than continue parsing. Otherwise, the parse should continue. 
                var isEnd = scan(newS.slice(ASTnode['length']), DTextTokens)['token'];
                 
                if(isEnd === 'INNERDTEXT'){
                    ASTnode['next'] = null;
                } else {
                    ASTnode['next'] = pDTextRecurse(newS.slice(ASTnode['length']));
                }      
                
                break;
            
            // PIPE indicates that another separate INNERDTEXT follows. Return null, so that parsing can restart on new INNERDTEXT
            case 'PIPE':
                ASTnode=null;
                break;
            // DEND indicates that the definition is over, so return null so the templatedfinition parser can complete parse of template defiintion.  
            case 'DEND':
                ASTnode=null;
                break;
        }
        
        return ASTnode;
    }
    
    return pDTextRecurse(s);
}


function parseIText(s){
    //Tokens required for parseing IText
    var ITextTokens = {TSTART:true, DSTART:true, PSTART:true, PIPE:true, TEND:true, PEND:true, INNERTEXT:true};
    
    function pITextRecurse(newS){
        
        //Find next token in string
        var token = scan(newS, ITextTokens);
                
        var ASTnode = {name: 'itext', INNERTEXT: null, templateinvocation: null, templatedef: null, tparam:null, next:null, length:null};
        
        //If there is no match on the token, then the ASTnode is empty itext
        if(token === 'NO MATCH'){
            return null;
        }
        
        //Use switch to determine what to do based on token.
        switch(token['token']){
            //In the case of TSTART, We need to parse a template invocation in our ASTnode, at key 'templateinvocation'. After that, our ASTnode's length = length of template invocation. Then, we recursively parseAgain, but this time starting from the point in the string passed the template invocation we just parsed. hence the newS.slice(ASTnode['length'])
            case 'TSTART': 
                ASTnode['templateinvocation'] = parseTemplateInvocation(newS);
                ASTnode['length'] = ASTnode['templateinvocation']['length'];
                ASTnode['next'] = pITextRecurse(newS.slice(ASTnode['length']));
                break;
            //Same as above with template definition
            case 'DSTART': 
                ASTnode['templatedef'] = parseTemplateDef(newS);
                ASTnode['length'] = ASTnode['templatedef']['length'];
                ASTnode['next'] = pITextRecurse(newS.slice(ASTnode['length']));
                break;
            //Same as above with template parameters
            case 'PSTART': 
                ASTnode['tparam'] = parseTParam(newS);
                ASTnode['length'] = ASTnode['tparam']['length'];
                ASTnode['next'] = pITextRecurse(newS.slice(ASTnode['length']));
                break;
            //In the case of scanning INNERDTEXT, we simply take the string value of our token. After this we set it's length. see comment below for isEnd explaination. 
            case 'INNERTEXT': 
                ASTnode['INNERTEXT'] = token['value'];
                ASTnode['length'] = ASTnode['INNERTEXT'].length;
                stripWhitespace(['INNERTEXT'], ASTnode);                
                
                //isEnd is a premptive scan after the outertext extracted above. It will be set to the token name of the token found in scanning. Below is an if statement. The point here is that, if INNERTEXT is followed by more INNERTEXT, this means that the first INNERTEXT was parsed up until something in the negative lookahead of the INNERTEXT regex. If the next scanned item if also INNERTEXT, then the next item in the string must appear in the negavite lookahead of the regEx for INNERTEXT. So the appropriate reaction is to return null, rather than continue parsing. Otherwise, the parse should continue. 
                var isEnd = scan(newS.slice(ASTnode['length']), ITextTokens)['token'];
                 
                if(isEnd === 'INNERTEXT'){
                    ASTnode['next'] = null;
                } else {
                    ASTnode['next'] = pITextRecurse(newS.slice(ASTnode['length']));
                }      
                
                break;
            
            // PIPE indicates that another separate INNERTEXT follows. Return null, so that parsing can restart on new INNERTEXT
            case 'PIPE':
                ASTnode=null;
                break;
            // TEND indicates that the definition is over, so return null so the templatedfinition parser can complete parse of template defiintion.
            case 'TEND':
                ASTnode=null;
                break;
            // PEND actaully catches TEND. But this is to help with ambiguity. }}} is caught by PEND, but not TEND, however in this case }}} actually refers to }} (TEND) + } (INNERTEXT). So I'm using PEND to catch an edge case of TEND. 
            case 'PEND':
                ASTnode=null;
                break;
        }
        
        return ASTnode;
    }
    
    return pITextRecurse(s);
}


function parseTArgs(s){
    var ASTnode = {name: 'targs', itext: null, next: null, length: null};
    
    //s.length is 0 if the Targs are empty. There are no Targs.  
    if(s.length === 0){
        return null;
    }
    
    //Make sure there is pipe before Targs. 
    checker({PIPE:true}, "TARGS ERROR: No Pipe token", s)
    
    //Extract itext using parser and put under itext key. Must occur after PIPE hence (s.slice(1))
    ASTnode['itext'] = parseIText(s.slice(1));
    
    //When itext = null, set length 0 else set length as itext.length
    if(ASTnode['itext']===null){
        var iLen = 0;
    } else {
        var iLen = getLength(ASTnode['itext'], 0);  
    }
            
    //Set length of ASTnode to 1+ iLen
    ASTnode['length'] = 1 + iLen;
    
    //If a pipe follows, parse next argument, if no pipe follows do nothing. 
    if(scan(s.slice(ASTnode['length']), {PIPE:true})==='NO MATCH'){
    } else {
        ASTnode['next']=parseTArgs(s.slice(ASTnode['length']));
    }
    
    return ASTnode;
}


function parseTParam(s){
    var ASTnode = {name: 'tparam', PNAME: null, length: null};
    
    //Checker: Does PSTART exist? If no throw error
    checker({PSTART:true}, "TPARAM ERROR: No PSTART token", s)
     
    //Regex for PNAME after the {{{ PSTART in the string. If blank, make vlaue blank. 
    var emptyCheck = scan(s.slice(3), {PEND:true});
    var scannedValue = scan(s.slice(3), {PNAME:true});
    if(scannedValue!=='NO MATCH' && emptyCheck==='NO MATCH'){
         ASTnode['PNAME'] = scannedValue['value'];
    } else {
         ASTnode['PNAME'] = "";
    }
    var nameLen = ASTnode['PNAME'].length;
    
    //Checker: Does PEND exist? If no throw error
    checker({PEND:true}, "TPARAM ERROR: No PEND token", s.slice(3+nameLen));
    
    //Set length to 6 (for PSTART+PEND) and length of name.  
    ASTnode['length'] = 6 + nameLen;
    
    //Strip leading and falling whitespace
    stripWhitespace(['PNAME'], ASTnode);
    
    return ASTnode;
}



//HELPER FUNCTIONS
//checker returns an error if a token in token list is not matched to string
function checker(tokenList, error, s){
    if(scan(s, tokenList)==='NO MATCH'){
        throw error;
    }    
}

//Will return the full length of an object by adding up length of itself and all objects in 'next' 
function getLength(tree, length){
    if(tree['next']===null){
        return length+tree['length'];
    }
    
    return getLength(tree['next'], length+tree['length']);
}

//Strips strings of white space of values in hashtable in keys in keyset. 
function stripWhitespace (keySet, hashTable){
    function strip(s){
        var whiteSpace = new RegExp('[\r\n\t\f\v ]*');
        var cutAt = s.match(whiteSpace)[0].length;
        return s.slice(cutAt);        
    }
    
    function reverseString(s){
        var stringArray = s.split("");
        var reverseArray = stringArray.reverse();
        var joinedArray = reverseArray.join('');
        return joinedArray;
    }
    
    function completeStrip(s){
        var frontStrip = strip(s);
        var revString = reverseString(frontStrip);
        var revStrip = strip(revString);
        return reverseString(revStrip);
    }
    
    if(keySet[0]===undefined){
        
    } else {
        hashTable[keySet[0]]=completeStrip(hashTable[keySet[0]]);
        stripWhitespace(keySet.slice(1), hashTable);
    }
}


//returns true if a string is only whitespace. 
function isAllWhiteSpace(s){
    var existNotWhite = new RegExp("[^\r\n\t\f\v ]");
    
    if(s.match(existNotWhite)===null){
        return true;
    }
    
    return false;    
}
