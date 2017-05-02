function printAST(a){
    
    //Will construct string for printing from ASTnode
    function stringConstruct(a){
        
        //if no ASTnode is passed in, return ""
        if(a===null){
            return "";
        }
        
        //Put name of ASTnode in name. 
        var name = a['name'];
                
        //Use switch to control action depending on node name. 
        switch(name){
            
            //In case of outer. If there is outertext, add this to string. If there is a template definition, callstring construct on template definition surrownded by {{ }}, If there isa template invocation  callstring construct on template definition surrownded by {: :}. After, recurse on a['next'];
            case 'outer':
                var stringAdd = null;
                
                if(a['OUTERTEXT']!==null){
                    stringAdd = a['OUTERTEXT'];
                }
                    
                if(a['templatedef']!==null){
                    stringAdd = "{:" + stringConstruct(a['templatedef']) + ":}";
                } 
                
                if(a['templateinvocation']!==null){
                    stringAdd = "{{" + stringConstruct(a['templateinvocation']) + "}}";
                }
                
                return stringAdd + stringConstruct(a['next']);
                break;
                
            //IN case of templatedef. recurse on dtext. then recurse on xdtext. Then return concatenation of these two strings. 
            case 'templatedef':
                var dText = stringConstruct(a['dtext']);
                var xDText = stringConstruct(a['xdtext']);
                return "" + dText + xDText;
                break;
            
            // same as above with rtemplateinvocation, itext and targs. 
            case 'templateinvocation':
                var itext = stringConstruct(a['itext']);
                var targs = stringConstruct(a['targs']);
                return "" + itext + targs;
                break;    
            
            //Just return parameter name. 
            case 'tparam':
                return "" + a['PNAME'];
                break;    
            
            //IN case of dtext, similar to outer only with INNERDTEXT, templatedef, templateinvocation, tparam.  
            case 'dtext':
                var stringAdd = null;
                                
                if(a['INNERDTEXT']!==null){
                    stringAdd = a['INNERDTEXT'];
                }
                
                if(a['templatedef']!==null){
                    stringAdd = "{:" + stringConstruct(a['templatedef']) + ":}";
                } 
                
                if(a['templateinvocation']!==null){
                    stringAdd = "{{" + stringConstruct(a['templateinvocation']) + "}}";
                }
                
                if(a['tparam']!==null){
                    stringAdd = "{{{" + stringConstruct(a['tparam']) + "}}}";
                }
                
                return stringAdd + stringConstruct(a['next']);
            
            //IN case of itext, similar to outer only with INNERTEXT, templatedef, templateinvocation, tparam.  
            case 'itext':
                var stringAdd = null;
                                
                if(a['INNERTEXT']!==null){
                    stringAdd = a['INNERTEXT'];
                }
                
                if(a['templatedef']!==null){
                    stringAdd = "{:" + stringConstruct(a['templatedef']) + ":}";
                } 
                
                if(a['templateinvocation']!==null){
                    stringAdd = "{{" + stringConstruct(a['templateinvocation']) + "}}";
                }
                
                if(a['tparam']!==null){
                    stringAdd = "{{{" + stringConstruct(a['tparam']) + "}}}";
                }
                
                return stringAdd + stringConstruct(a['next']);
                
            //in case of targs, return |, followed by recursion on itext, then on next
            case 'targs':
                return "|" + stringConstruct(a['itext']) + stringConstruct(a['next']) 
            
            //in case of xdtext, return |, followed by recursion on dtext, then on next
            case 'xdtext':
                return "|" + stringConstruct(a['dtext']) + stringConstruct(a['next']);
                
        }   
        
    }
    
    return stringConstruct(a);
    
}


window.console.log(printAST(parseOuter('{:fact|n|{{#ifeq|{{#expr|{{{n}}}==0}}|true|1|{{#expr|{{{n}}}*{{fact|{{#expr|{{{n}}}-1}}}}}}}}:}{:f |x |y  |{:a||{{#expr|{{{x}}}+1}}:}{:b||{{#expr|{{{y}}}+1}}:}{{#expr|{{a}}+{{b}}}}:}{{f|2|3}}=7')));