//James McCafferty 260 638 883 A3Q1

//The variable will hold all environments for searches by name. (This is necessary for the stringify function in q4)
var allEnv = {};

//Creates an environment with parent environment = parent, environment name = random number with 10 digits, environment bindings = empty bindings object. 
function createEnv(parent){
    // Used a rounded int as name to make more readable
    var name = Math.round(Math.random()*1000000000);
    var bindings= {}
    
    // If there is no parent argument, then this node is it's own parent. 
    if(parent){
        var parent = parent;
    } else {
        var parent = null;
    }

    //Initialize environment
    var env = {'name':name, 'bindings':bindings, parent:parent }
    
    //if parent is set to null, this indicates that this environment is it's own parent 
    if(env.parent === null){
        env.parent = env;
    }
    
    //Add environment to allEnv, with key = name and value = environemnt
    allEnv[env.name] = env;
    
    return env;
}


//Looks up a binding starting from current environment, then moving through that environment's parents 
function lookup(name, env){

    //Look for name in environment bindings. If there, return the value. 
    if(name in env.bindings){
        return env.bindings[name];
    }
    
    //If the next environment name = this environment name, then the binding dosen't exist. 
    if(env.parent.name === env.name){ return null };
    
    //Recursively perform look up on the parent environment
    return lookup(name, env.parent);     
}

