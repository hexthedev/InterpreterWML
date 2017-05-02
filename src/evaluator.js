//James McCafferty 260 638 883 A3Q2

//Evaluate AST node, starting from the root environment
function evalWML(ast, env){
    //Holds the string to return
    var stringReturn;
    
    //Adds the appropriate string to string return, by evaluating the appropriate AST node 
    if(ast.OUTERTEXT !== null){
        stringReturn = ast.OUTERTEXT;
    } else if(ast.templatedef !== null){
        var templateString = evalTemplateDef(ast.templatedef, env);
        
        //evalTemplateDef may return null, if anonymous function is called
        if(templateString == null){
            stringReturn = "";
        } else {
            stringReturn = templateString;
        }
        
        
    } else if(ast.templateinvocation !== null){
        stringReturn = evalTemplateInvocation(ast.templateinvocation, env);
    }
    
    //If there is no following astNode, end execution by returning last string.
    if(ast.next === null){
        return stringReturn;
    }
    
    //Return stringReturn, then continue to next node. 
    return stringReturn + evalWML(ast.next, env);
}

//Evaluate Template Definitions
function evalTemplateDef(ast, env){
    
    //Find name of definition by evaluating dtext in ast.
    var name = evalDText(ast.dtext, env).trim();
    //if name begins with `, then this is a closure. reroute exection to evalCLosure()
    if(name[0]==='`'){
        return evalClosureDef(ast, env);
    }
     
    //Define a templateDefinition object holding params, body and parent environment
    var templateDef = {params:null, body:null, env:null};
    
    //set templateDef environment to the current environemnt (Where it was defined for static scope)
    templateDef.env = env;
        
    //evaulate the dparams. This function will fill in the body and params field of the template definition.
    evalDParams(ast.dparams, templateDef);
    
    //In the environment bindings, bind function to name.
    env.bindings[name] = templateDef;
}

//Evaluate definition text
function evalDText(ast, env){
    if(ast===null){ return ""; };
    
    //HOlds string to return
    var stringReturn;
    
    //Adds the appropriate string to string return, by evaluating the appropriate AST node 
    if(ast.INNERDTEXT !== null){
        stringReturn = ast.INNERDTEXT;
    } else if(ast.templatedef !== null) {
        var templateString = evalTemplateDef(ast.templatedef, env);
        if(templateString == null){
            stringReturn = "";
        } else {
            stringReturn = templateString;
        }
    } else if(ast.templateinvocation !== null) {
         stringReturn =  evalTemplateInvocation(ast.templateinvocation, env);
    } else if(ast.tparam !== null) {
        stringReturn = lookup(ast.tparam.pname.trim(), env);
        if(stringReturn === null) { stringReturn = "{{{" + ast.tparam.pname.trim() + "}}}"};
    }
    
    //If next = null, simply return stringReturn
    if(ast.next === null){
        return stringReturn;
    }
    
    //Return stringReturn + recursive evaultion of ast.next
    return stringReturn + evalDText(ast.next, env);
}


//Evaluates definition parameters
function evalDParams(ast, templateDef){
    
    //Initializes the templateDef.params array. 
    if(templateDef.params===null){
        templateDef.params = [];
    }
        
    //if ast.next is null, this must be the last dparams dtext, which means it must be the body. Otherwise, the current ast node is a parameter in which case it will be added to templateDef.params
    if(ast.next === null){
        templateDef.body = ast;
    } else {
        var dtext = evalDText(ast.dtext, templateDef.env);
        templateDef.params[templateDef.params.length] = dtext.trim();
        evalDParams(ast.next, templateDef);
    }               
}

//Evaluates Template Invocations
function evalTemplateInvocation(ast, env){
    
    //Initialize name by evaluating Itext
    var name = evalIText(ast.itext, env).trim();
    
    //If the name begins with ```, then this is a closure and execution is rerouted to evalClosureInvoc
    if(name.slice(0,3) === '```'){
        return evalClosureInvoc(name, ast, env);
    }
    
    //If the name is any of the following, then this is a special template. Reroute execution to appropriate template evaluator. 
    if(name === "#if"){
        return evalIf(ast.targs, env);
    } else if (name === "#ifeq"){
        return evalIfeq(ast.targs, env);
    } else if(name === "#expr"){
        return evalExpr(ast.targs, env);
    }
    
    //Lookup definition
    var def = lookup(name, env);
    
    //If template is non-existant. return {{name}}
    if(def === null){ return "{{" + name + "}}" };
    
    //Create new environment using the definitions environemtn (static scope)
    var newEnv = createEnv(def.env);
    
    //Set the arguments using evalArgs 
    evalArgs(ast.targs, env, newEnv, def.params);

    //Evaluate the body by passing body dtext into evalDText
    if(def.body !== undefined){
        var bodyReturn = evalDText(def.body.dtext, newEnv);    
    } else {
        throw ("Def.body is undefined for none existant function called: " + name + "");
    }
    
    return bodyReturn;
        
}

//Evaluates Invocation Text
function evalIText(ast, env){
    //This catches errors
    if(ast===null){ return ""; };
    
    //Initialize string to return
    var stringReturn;
    
    //Use appropriate eval function for different situations. 
    if(ast.INNERTEXT !== null){
        stringReturn = ast.INNERTEXT;
    } else if(ast.templatedef !== null) {
        var templateString = evalTemplateDef(ast.templatedef, env);
        if(templateString == null){
            stringReturn = "";
        } else {
            stringReturn = templateString;
        }
    } else if(ast.templateinvocation !== null) {
         stringReturn =  evalTemplateInvocation(ast.templateinvocation, env);
    } else if(ast.tparam !== null) {
        stringReturn = lookup(ast.tparam.pname.trim(), env);
        if(stringReturn === null) { stringReturn = "[NO PARAM OF NAME FOUND: " + ast.tparam.pname.trim() +"]"};
    }
    
    //If this is the last node, stop recursion
    if(ast.next === null){
        return stringReturn;
    }
    
    //Return current return string + recursive call on next node
    return stringReturn + evalIText(ast.next, env);
}


function evalArgs(ast, parentEnv, targetEnv, params){
    //Nothing happens unless ast is not null and there are parameters in params
    if(params === undefined){
        throw ("params are undefined. This normally means that a function passed in here was none existant, so does not have an associated object and is just literal text");
    } else if(ast !== null && params.length !== 0){
        //Finds the value that needs binding
        var bindingValue = evalIText(ast.itext, parentEnv);
        //Creates a binding with name equal to firstParameter in params of target environment
        targetEnv.bindings[params[0]] = bindingValue;
        //Recursively calls evalArgs on ast.next. Removes first element of params array. 
        evalArgs(ast.next, parentEnv, targetEnv, params.slice(1));
    } else if(params.length !== 0){
        //If more parameters are entered in template definition than args, saves additional parameters named as themselves.
        targetEnv.bindings[params[0]] = params[0];
        evalArgs(ast, parentEnv, targetEnv, params.slice(1));
    }
}
