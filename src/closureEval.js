//James McCafferty 260 638 883 A3Q4

//Evaluates a CLosure Definition
function evalClosureDef(ast, env){
 
    //Extracts the name of the Definition by evaluating definition text. 
    var name = evalDText(ast.dtext, env).trim();

    //Initiates templateDefinition Object
    var templateDef = {params:null, body:null, env:null};
    
    //Sets the template Definition environment
    templateDef.env = env;
    
    //Places parameters into templateDef params
    evalDParams(ast.dparams, templateDef);
    
    //If length = 1, then the defnition is anonymous, because the name = '`'. Otherwise, it is named and we should create a binding in the current environment. 
    if(name.length > 1){
        env.bindings[name.slice(1)] = templateDef;
    }
    
    //return a string version of the template definition object. 
    return stringifyTemplate(templateDef);
}

//Evaluates Closure Invocations
function evalClosureInvoc(string, ast, env){
    
    //This converts the string version of a templateDefinition in string back into an object. 
    var templateDef = unstringifyTemplate(string);
    
    //A new environment is created for the invocation. 
    var newEnv = createEnv(templateDef.env); 
    
    //evalARgs sets appropriate arguments to parameters in new environment. 
    evalArgs(ast.targs, env, newEnv, templateDef.params);
    
    //The body is now evaluated, using the newEnvironment to find paramters
    var bodyReturn = evalDText(templateDef.body.dtext, newEnv);
    
    return bodyReturn;    
}

//Used to stringify templateDefs
function stringifyTemplate(templateDef){
    //Uses JSON to stringify body ast
    var bodyStr = JSON.stringify(templateDef.body);
    //Simply stores environment by name (This is done to deal with recursive environment calls)
    var envStr = templateDef.env.name;
    //Uses JSON to stringify paramsArray
    var paramsStr = JSON.stringify(templateDef.params);
    //It then returns a string representation of the templateDefinition. ``` = start of templateDefinition. ~~ = boundary between body, env and params. So the string looks like: ```body~~env~~params
    return "```" + bodyStr + "~~" + envStr + "~~" + paramsStr;
}

//Used to unstringify templateStrings
function unstringifyTemplate(templateString){
    //Removes the ``` indicating templateString
    var removeBackQuotes = templateString.slice(3);
    //Splits string into an Array using the ~~ boundary. Array = [body,env,params]
    var splitString = removeBackQuotes.split('~~');
    //initializes a template definition
    var templateDef = {params:null, body:null, env:null};

    //templateDef.body = the parsed version of the bodyString
    templateDef.body = JSON.parse(splitString[0]);
    //templateDef.env = the environment found using it's name. allEnv is a dictionary of environments with key=name and value=env. (This exists because of recursive environment definitions)
    templateDef.env = allEnv[splitString[1]];
    //templateDef.body = the parsed version of the params
    templateDef.params = JSON.parse(splitString[2]);
        
    return templateDef;
}