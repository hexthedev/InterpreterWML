//James McCafferty 260 638 883 COMP 302
var tokenHash = {TSTART:[TSTART,'{{'], TEND:[TEND,'}}'], DSTART:[DSTART,'{:'], DEND:[DEND,':}'], PSTART:[PSTART,'{{{'], PEND:[PEND,'}}}'], OUTERTEXT:[OUTERTEXT,'VARIABLE'], INNERTEXT:[INNERTEXT,'VARIABLE'], INNERDTEXT:[INNERDTEXT,'VARIABLE'], DNAME:[DNAME,'VARIABLE'], PNAME:[PNAME,'VARIABLE'], PIPE:[PIPE,'|']};


//SCANNER ------
function scan(s, tokenset){

    //Recursively cycle looking for tokens
    function scanRecurse(tokenArray){
        
        //When an empty tokenArray is present, there is no match in the string
        if(tokenArray[0]==undefined){
            return "NO MATCH"
        }
        
        //Use tokenHash to target the regular expression required to test the token represented by the string in tokenArray[0]. indexTest is used to see if the regEx has returned a match (if it does not return a match, indexTest will be null). 
        var indexTest = s.match(tokenHash[tokenArray[0]][0]);
        var index;
        
        //If the regex does not match, set index to -1 to indicate no match. Else, there is a match, and the match index is recorded in index. 
        if(indexTest===null){
            index = -1;
        } else {
            index = indexTest.index;
        }
        
        //The case where index is 0 indicates that a token has been found at the start of the string. IN this case, simply create the token/value object by finding the token name in tokenArray, and the value by looking up the value in tokenHash        
        if(index===0){
            var tokenName = tokenArray[0];
                
            var tokenValue;
            
            if(tokenHash[tokenName][1]==="VARIABLE"){
                tokenValue = s.match(tokenHash[tokenName][0])[0];
            } else {
                tokenValue = tokenHash[tokenName][1];
            }
            
            var toReturn = {token:tokenName, value:tokenValue};
            return toReturn;
        }
        
        //Will call function with tokenArray shifted left
        return scanRecurse(tokenArray.slice(1));
    }
    
    var tokenSetKeyArray = Object.keys(tokenset);
    
    return scanRecurse(tokenSetKeyArray);
    
}