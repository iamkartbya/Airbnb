class ExpressError extends Error{
    constructor(statusCode,message){
        super(message)
        this.statusCode=this.statusCode;
        
    }
}

module.exports=ExpressError;