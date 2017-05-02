//James McCafferty 260 638 883 A3Q3

//Evaluates #if definitions
function evalIf(ast, env){
    
    //Extracts test condition
    var conditionToTest = evalIText(ast.itext, env);        
    var bodyToEvaulate;
    
    //if test condition is true in JS, then set body to itext after condition. Else set body to itext two steps from condition. 
    if(conditionToTest){
        bodyToEvaulate = ast.next.itext;
    } else {
        bodyToEvaulate = ast.next.next.itext;
    }
    
    //Return the evalutation of selected body
    return evalIText(bodyToEvaulate, env);    
}

//Evaluates #ifeq definitions
function evalIfeq(ast, env){
    //Extracts a and b. They will be compared
    var a = evalIText(ast.itext, env);
    var b = evalIText(ast.next.itext, env);
    
    //By comparing a and b, extracts the appropriate body and places in bodyToEvaluate
    var bodyToEvaulate;
    if(a === b){
        bodyToEvaulate = ast.next.next.itext;
    } else {
        bodyToEvaulate = ast.next.next.next.itext;
    }
    
    //Returns the evaluation of the appropriate body
    return evalIText(bodyToEvaulate, env);
}

//Evaluates #expr definitions
function evalExpr(ast, env){
    //If given null ast, then nothing can be calculates, return empty string
    if(ast === null){ return ""; };
    
    //Set toEval to evaluated itext
    var toEval = evalIText(ast.itext, env);
    
    //JavaSCript attempts to evaluate the extracted expression. If ana error is thrown, instead is returns a warning + what it was trying to evaluate. 
    try{
        eval(toEval)
    } catch (e){
        return "[NOT APPROPRIATE JS EXPRESSION]("+toEval+")";
    }
     
    //Returns the result of evaluation. 
    return "" + eval(toEval);
}