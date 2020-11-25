public class customMultiSelectLookupCtrl {
        //This method retrieves the data from database table. It search input is '*', then retrieve all records
    @AuraEnabled (cacheable=true)
    public static List<SObject> retrieveRecords(String objectName, 
                                                    String fieldAPINames,
                                                    String filterFieldAPIName,
                                                    String strInput,
                                                	String filterInFieldAPIName,
                                               		list<String> filterInStrings){
        
        List<SObjectQueryResult> lstReturnResult = new List<SObjectQueryResult>();
        if(strInput.equals('*')){
            strInput = '';
        }
        String str = strInput + '%';
        String strQueryField = '';
        List<String> fieldList = fieldAPINames.split(',');

        //check if Id is already been passed
        if(!fieldList.contains('Id')){
            fieldList.add('Id');
            strQueryField = String.join(fieldList, ',');
        }else {
            strQueryField = fieldAPINames;
        }

        String strQuery = 'SELECT ' + String.escapeSingleQuotes(strQueryField) 
                        + ' FROM ' 
                        + String.escapeSingleQuotes(objectName)
            			+' WHERE ' + filterFieldAPIName + '  LIKE \'' + str + '%\'';
        if(filterInFieldAPIName!=null && filterInFieldAPIName!='' && filterInStrings!=null && !filterInStrings.isEmpty())
        {
            strQuery=strQuery+' AND '+filterInFieldAPIName+' IN:filterInStrings';
        }                                                                
        strQuery = strQuery+' ORDER BY ' + filterFieldAPIName + ' LIMIT 50';
                        
        System.debug('strQuery=' + strQuery);

        List<SObject> lstResult = database.query(strQuery);
        return lstResult;
        //create list of records that can be easily be parsable at js controller.
        /*for(String strField:fieldList){
            system.debug('strFiled='+strField);
            for(SObject sobj:lstResult){
                system.debug('in for='+sobj);
                if(strField != 'Id'){
                    SObjectQueryResult result = new SObjectQueryResult();
                    result.recordId = (String) sobj.get('Id');                    
                    result.recordName = (String) sobj.get(strField);                        
                    lstReturnResult.add(result);
                }                
            }
        }
                                                        
        for(SObject sobj:lstResult)
        {
            SObjectQueryResult result = new SObjectQueryResult();
            result.recordId = (String) sobj.get('Id');                    
            for(String strField:fieldList)
            {                	
                if(strField!='Id')              
                {              
                    if(strField=='Name')
                    {
						result.recordName = (String) sobj.get(strField);                                           	                        
                    }
                   	if(strField=='Email')
                    {
                        result.recordName = (String) sobj.get(strField);                                           	                        
                    }
                }                    
            }
            lstReturnResult.add(result);
        }
        return lstReturnResult;*/
    }
    
    public class SObjectQueryResult {
        @AuraEnabled
        public String recordId;
        @AuraEnabled
        public String recordName;
        //@AuraEnabled
        //public String recordEmail;
    }

}