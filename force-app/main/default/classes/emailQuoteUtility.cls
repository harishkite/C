public class emailQuoteUtility {
    @AuraEnabled(cacheable=true)
    public static map<String,String> defaultQuoteTypes(String productid, String sbucode)
    {
        list<String> settingNames = new list<String>();
        map<string,defaultfiletype__c> alldefaultPDF = defaultfiletype__c.getAll();        
        settingNames.addAll(alldefaultPDF.keySet());        
        settingNames.sort();        
        map<String,String> dfltQuoteOpts = new map<String,String>();
        for(string str:settingNames){                        
            if(sbucode=='CS Italy' && str.contains(productId+'_FR') ){        
                dfltQuoteOpts.put( alldefaultPDF.get(string.valueof(str)).PDF_URL__c, alldefaultPDF.get(string.valueof(str)).PDF_Name__c );                       
            }
        }
    	system.debug('dfltQuoteOpts='+dfltQuoteOpts);
        return dfltQuoteOpts;
    }
    @AuraEnabled
    public static list<emailTemplateClass> emailTemplateData(String templateId, String quoteId)
    {
        List<Messaging.SingleEmailMessage> msgList= new List<Messaging.SingleEmailMessage>();
        Messaging.SingleEmailMessage msg = new Messaging.SingleEmailMessage();
        list<emailTemplateClass> emailData = new list<emailTemplateClass>();
        msg.setTemplateId(templateid);
        msg.setWhatId(quoteId);
        msg.setTargetObjectId([select id from contact where email!=null limit 1].id);
        msgList.add(msg);
        Savepoint sp = Database.setSavepoint();
        Messaging.sendEmail(msgList);
        Database.rollback(sp);
        //emailSubject = msg.getSubject();
        for (Messaging.SingleEmailMessage email : msgList) {
            /*quote.Email_Body__c = email.getHTMLBody()!=null?email.getHTMLBody():'';
            if(quote.Email_Body__c.contains('[Roles]')){
            quote.Email_Body__c=quote.Email_Body__c.replace('[Roles]',(role!=null && role!=''?role:''));
            if(quote.Email_Body__c.contains('[ExComm]')){
            quote.Email_Body__c=quote.Email_Body__c.replace('[ExComm]',(Commission!=null && Commission!=''?Commission:''));
            }
            }
            emailSubject=email.getSubject();*/
            emailData.add(new emailTemplateClass(msg.getSubject()!=null?msg.getSubject():'',msg.getHtmlBody()!=null?msg.getHtmlBody():''));
        }
        system.debug('emailData=='+emailData);
        return emailData;
    }
    public static List<Messaging.SingleEmailMessage> msgList = new List<Messaging.SingleEmailMessage>();
    @AuraEnabled
    public static string sendEmail(list<String> toAddress, 
                                   list<String> ccAddress,
                                   list<String> bccAddress,
                                   String emailSubject, 
                                   String emailBody,
                                   list<String> attachments,
                                   list<String> toAddressConIds,
                                   String quoteId)
    {
        String allfileName='';
        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage(); 
        Messaging.EmailFileAttachment[] efas = new Messaging.EmailFileAttachment[]{};
        if(label.DoNot_Reply_Email_User_Ids.contains(userinfo.getUserId())){
            OrgWideEmailAddress[] owea = [select Id from OrgWideEmailAddress where Address = 'noreply@c-sgroup.com'];
            if (!owea.isEmpty() && owea.size() > 0 ) {
                email.setOrgWideEmailAddressId(owea.get(0).Id);
            }
        }
        list<Task> tasks = new list<Task>();
        /*---Getting attachments-START--*/
        if(attachments!= null && attachments.size()> 0){
            // Create the email attachment
            for(Attachment att:[SELECT Name,Body FROM Attachment WHERE Id IN:attachments]){
                Messaging.EmailFileAttachment efa = new Messaging.EmailFileAttachment();
                efa.setFileName(att.Name);
                allfileName += att.Name +'<br/>';
                efa.setBody(att.Body);
                att = null; // reset to null for free the heap
                efas.add(efa);
            }
        }
        /*---Getting attachments-END--*/
        String allfilelink='';
        
        
        email.setSubject( emailSubject == null? '' : emailSubject );
        if(toAddress!=null && !toAddress.isEmpty())
        {
        	email.setToAddresses(toAddress);            
        }        
        else
        {
            return system.label.Email_Quote_Rep_Mandatory;
        }
        if(ccAddress!=null && !ccAddress.isEmpty())
        {
        	email.setCcAddresses(ccAddress);    
        }
        if(bccAddress!=null && !bccAddress.isEmpty())
        {
        	email.setBccAddresses(bccAddress);    
        }        
        email.setHtmlBody(emailBody);
        email.setFileAttachments(efas);
        /*---TASK Creation START---*/
        if(toAddressConIds!=null && !toAddressConIds.isEmpty())
        {
            for(String s:toAddressConIds)
            {
                Task t = new Task(WhatId = quoteId, WhoId = s, Subject= emailSubject == null? '' : emailSubject, status ='Completed');
                if(emailBody!= null && emailBody.length() > 0){
                    if(emailBody!=null && emailBody.length()>31999) 
                    {
                        t.Description = emailBody.substring(0,31999);    
                    }
                    else
                    {
                        t.Description = emailBody;
                    }
                }
                else
                {
                    t.Description = '';
                }
                tasks.add(t);
                
            }
        }
        /*---TASK Creation END----*/
        try{
            Messaging.SendEmailResult [] r = Messaging.sendEmail(new Messaging.SingleEmailMessage[] {email});
            createActivities(tasks);
            return 'success';
        }catch(Exception e){            
            //errorMessages.add(e.getMessage());
            //ApexPages.addMessage(new ApexPages.Message(ApexPages.SEVERITY.ERROR,e.getMessage()));
            return e.getMessage();
        }             	
    }
    public static void createActivities(list<Task> tasks){
        if(tasks.size() > 0) insert tasks;
    }
    @AuraEnabled
    public static list<attachmentsClass> fetchQuoteDocsFromServer(list<String> defaultQuoteType, String dwnType, String selectedQuoteType,String selectedQuoteTypeLabel, String quoteId)
    {
        
        list<Quotes__c> quoteData = fetchQuoteRecord(new list<String>{quoteId});
        list<String> links = new list<String>();
        String serverURL = erapidDocsBaseURL(quoteData[0].RecordType.Name);
        Integer counterCall=0;
        String theURL;
        String fileName;
        String sToken;
        String sandboxname=system.label.Erapid_Sandbox_Environment;
        Map<Integer, serverCsgroupCom.RequestParams> mapErapidCallOutItem = new Map<Integer, serverCsgroupCom.RequestParams>();
        system.debug('defaultQuoteType=='+defaultQuoteType);
        system.debug('dwnType=='+dwnType);
        /*if(defaultQuoteType!=null)
        {
            String[] defaultQuoteTypeList = defaultQuoteType;//.split(',');
            for(String ftype:defaultQuoteTypeList)
            {
                system.debug('ftype=='+ftype);
                String fileName1='';
                if(ftype.contains('/email/')){       
                            filename1= ftype.split('/email/',ftype.length())[1];      
                            filename1=filename1.contains('.pdf')?filename1.removeEnd('.pdf'):filename1.removeEnd('.doc');       
                        }       
                		else if(filename1==''){filename1='DossierTechnique';}      
                        //else if(csOppRecordType=='C/S FR' && filename1==''){filename1='DossierTechnique';}      
                        //filename1+'_'+quoteData[0].Erapid_Quote_No__c,
                        system.debug('fileName=='+filename1);
                mapErapidCallOutItem.put(counterCall++,makeApiInstance(filename1,
                                                                       ftype,
                                                                       quoteData[0].Name,
                                                                       getEgnyteToken(),
                                                                       quoteId,
                                                                       dwnType,
                                                                       '.pdf',
                                                                       fType,
                                                                       '2',
                                                                       quoteData[0].Erapid_Quote_No__c,
                                                                       '1',
                                                                       quoteData[0].ADSrepNo__c,
                                                                       getUserId(),
                                                                       ''
                                                                      ));
                                
            }   
        }*/
        if(selectedQuoteType!=null)
        {
            system.debug('selectedQuoteType=='+selectedQuoteType);
            system.debug('selectedQuoteTypeLabel=='+selectedQuoteTypeLabel);
            String docExtType = selectedQuoteTypeLabel!=null && selectedQuoteTypeLabel.contains('Word')?'.rtf':'.pdf';
            String docurl = selectedQuoteType.replace('##ErapidQuoteNo##', quoteData[0].Erapid_Quote_no__c);
            String docName = 'CS_Italy_'+quoteData[0].Erapid_Quote_No__c;
           
            mapErapidCallOutItem.put(counterCall++,makeApiInstance(docName,
                                                                       docurl,
                                                                       quoteData[0].Name,
                                                                       getEgnyteToken(),
                                                                       quoteId,
                                                                       dwnType,
                                                                       docExtType,
                                                                       '1',
                                                                       '2',
                                                                       quoteData[0].Erapid_Quote_No__c,
                                                                       '1',
                                                                       quoteData[0].ADSrepNo__c,
                                                                       getUserId(),
                                                                       ''
                                                                      ));
        }
        list<attachmentsClass> attchmentList = new list<attachmentsClass>();
        list<String> filePathList = new list<String>();
        set<ID> attIds = new set<ID>();
        //*--Callout Processing it with attachments START---*/
        for(Integer i=0;i<mapErapidCallOutItem.size();i++)
        {
            serverCsgroupCom.RequestParams req = mapErapidCallOutItem.get(i);
            serverCsgroupCom.ResponseResult res = documentApiCallout(mapErapidCallOutItem.get(i));    
            if(res.errorCode!=0)
            {
                ///////ROLLBACK IF WE GOT ERROR////
                /*if(sToken != null && sToken != ''){
                        rollBack(sToken);
                }*/
                //Need to return error here itself rather than loop all
            	attchmentList.add(new attachmentsClass(res.errorMsg,'','',''));    
            } 
            else
            {
     			string filePath = 'Shared/Salesforce.com/Quotations/'+req.sfQuoteNo+'/'+req.FileName+''+req.fileExtension;          
                system.debug('filePath'+filePath);
                filePathList.add(filePath);
                if(req.dowloadAs != 'URL'){
                    //attachments.put(counterCall,resp[0].sfDocId);
                    //linkOrAttchment.add(new previewFileWrapper(req.fileName, resp[0].sfDocId));
                    attchmentList.add(new attachmentsClass('','/servlet/servlet.FileDownload?file='+res.sfDocId,res.sfDocId,req.fileName+''+req.fileExtension));                    
                }
                else{
                    //links.put(counterCall,resp[0].egnytePubUrl);
                    //linkOrAttchment.add(new previewFileWrapper(fileName, resp[0].egnytePubUrl));
                    attchmentList.add(new attachmentsClass('',res.egnytePubUrl,res.egnytePubUrl,req.fileName+''+req.fileExtension));                    
                }                
            }
        }        
        //*--Callout Processing it with attachments END-----*/        
        for(Attachment a: [SELECT Id,name from Attachment WHERE ID IN:attIds])
        {
        //    attchmentList.add(new attachmentsClass('','/servlet/servlet.FileDownload?file='+a.Id,a.Id,a.Name));
        }
        return attchmentList;
    }
	@AuraEnabled
    public static serverCsgroupCom.ResponseResult documentApiCallout(serverCsgroupCom.RequestParams reqParams)
    {        
        serverCsgroupCom.RequestParams req = reqParams;
        serverCsgroupCom.FileSyncCalloutPort serviceport = new serverCsgroupCom.FileSyncCalloutPort();
        servicePort.timeout_x=120000;
        serverCsgroupCom.ResponseResult[] resp =  serviceport.fetchFile(new serverCsgroupCom.RequestParams[]{req}) ;
        system.debug(LoggingLevel.INFO,'serverCsgroupCom.RequestParams  ::'+req+'  serverCsgroupCom.ResponseResult::'+resp);                                
        return resp[0];
    }        
    @AuraEnabled
    public static string documentApiCalloutFIRSTWRITTEN(Map<Integer, serverCsgroupCom.RequestParams> mapErapidCallOutItem)
    {
        Integer counterCall=mapErapidCallOutItem.size();
        map<Integer,string> attachments = new map<Integer,string>();
        map<Integer,string> links = new map<Integer,string>();
        list<attachmentsClass> linkOrAttachment = new list<attachmentsClass>();
        serverCsgroupCom.RequestParams req = mapErapidCallOutItem.get(0);
                serverCsgroupCom.FileSyncCalloutPort serviceport = new serverCsgroupCom.FileSyncCalloutPort();
                servicePort.timeout_x=120000;
                serverCsgroupCom.ResponseResult[] resp =  serviceport.fetchFile(new serverCsgroupCom.RequestParams[]{req}) ;
                system.debug(LoggingLevel.INFO,'serverCsgroupCom.RequestParams  ::'+req+'  serverCsgroupCom.ResponseResult::'+resp);
                system.debug('errorMsg=='+resp[0].errorMsg);
                if(resp[0].errorCode !=0){	
                    //egnytePubUrl,sfDocId
                    String processStatus = 'process complete';
                    //if(sToken != null && sToken != ''){
                        //rollBack(sToken);
                    //}
                    return resp[0].errorMsg;
                }
                else{
                    /*string filePath = 'Shared/Salesforce.com/Quotations/'+req.sfQuoteNo+'/'+req.FileName+''+req.fileExtension;          
                    system.debug('filePath'+filePath);
                    FilePathList.add(filePath);
                    string fileName=rtName=='CS DE'?'AngebotsNr'+quote1.Erapid_Quote_no__c+req.fileExtension:req.FileName+''+req.fileExtension;
                    fileName=rtName=='C/S ME'?'Quote'+quote1.Erapid_Quote_no__c+req.fileExtension:req.FileName+''+req.fileExtension;
                    fileName=rtName=='CS Asia'?'Quote'+quote1.Erapid_Quote_no__c+req.fileExtension:req.FileName+''+req.fileExtension;//CA-12*/
                    if(req.dowloadAs != 'URL'){
                        attachments.put(counterCall,resp[0].sfDocId);
                        //'/servlet/servlet.FileDownload?file='+a.Id,a.Id,a.Name
                        linkOrAttachment.add(new attachmentsClass('','', resp[0].sfDocId,''));
                    }
                    else{
                        links.put(counterCall,resp[0].egnytePubUrl);
                        linkOrAttachment.add(new attachmentsClass('','', resp[0].sfDocId,''));
                    }
                }
            
        return 'success';
    }
    @AuraEnabled    
    public static serverCsgroupCom.RequestParams makeApiInstance(String fileName,
                                                                 String eRapidFileUrl,
                                                                 String sfQuoteNo,
                                                                 String egnyteToken,                                                                 
                                                                 String sfRecordId,
                                                                 String dowloadAs,
                                                                 String fileExtension,
                                                                 String quoteTypeValue,
                                                                 String quoteTypeSize,
                                                                 String eRapidQuoteNo,
                                                                 String ignoreUpdate,
                                                                 String repNumber,
                                                                 String userId,
                                                                 String repTearSheet)
    {
        serverCsgroupCom.RequestParams request = new serverCsgroupCom.RequestParams();
        request.fileName = fileName;
        request.eRapidFileUrl = eRapidFileUrl;
        request.sfQuoteNo = sfQuoteNo;
        request.egnyteToken = egnyteToken;
        request.sfToken = fetchUserSessionId();//For Lightning we need to get SessionId from VF as Lightning sessionid is not working in uploading Email Quote docs to SFDC
        request.sfServerUrl = URL.getSalesforceBaseUrl().toExternalForm();
        request.sfRecordId = sfRecordId;
        request.dowloadAs = dowloadAs;
        request.fileExtension = fileExtension;
        request.quoteTypeValue = quoteTypeValue;
        request.quoteTypeSize = quoteTypeSize;
        request.eRapidQuoteNo = eRapidQuoteNo;
        request.ignoreUpdate = ignoreUpdate;
        request.repNumber = repNumber;
        request.userId = userId;
        request.repTearSheet = repTearSheet;
        if(fileName.contains('Summary_Sheet_') || fileName.contains('Tear_Sheet') ){//IMPACTS-194 Removing _ after tearsheet condition for IMPACTS-194 because for Impacts we are sending file name after Quote no - EX: quotename_tear_sheet - for Others we have Tear_sheet_orderno
            request.fileExtension = '.pdf';
        }
        return request;
    }
    @AuraEnabled
    public static list<Quotes__c> fetchQuoteRecord(list<String> quoteIds)
    {
        return [SELECT Id,Name,Erapid_Quote_No__c,ADSrepNo__c,Contact__r.email,Product_Id__c,C_S_Opportunity__r.RecordType.Name,RecordType.Name 
                FROM Quotes__c
                WHERE Id IN: quoteIds];
    }
	@AuraEnabled
	public static string getEgnyteToken()
    {
        list<eToken__c> userToken = [Select Token__c,Name From eToken__c where name =: UserInfo.getUserEmail() LIMIT 1];
        if(userToken!=null && !userToken.isEmpty() && userToken[0].Token__c!=null)
        {
            return userToken[0].Token__c;
        }
        return 'false';
    }
    @AuraEnabled
    public static string getUserId()
    {
        return [SELECT Id,Erapid_Id__c from User where id=:userinfo.getUserId()].Erapid_id__c;
    }
    @AuraEnabled(cacheable=true)
    public static Map<String,String> emailTemplateOptions()
    {
        String folderName = 'France Email Templates';
        Map<String,String> optionsMap = new Map<String,String>();
        List<EmailTemplate> et=[Select Subject,name, Folder.Name, FolderId, HtmlValue, Body From EmailTemplate where isActive=true and Name like 'France%'];
        for(EmailTemplate selectTemp:et){
            optionsMap.put(selectTemp.Id,selectTemp.Name);    
        }
        system.debug('optionsMap=='+optionsMap);
        return optionsMap;
    }
    //attachmentsClass to show attachments in UI
    public class attachmentsClass
    {
        @AuraEnabled
        public string errorMessage {get;set;}
        @AuraEnabled
        public string hrefUrl {get;set;}
        @AuraEnabled
        public string docId {get;set;}
        @AuraEnabled
        public string docName {get;set;}
        public attachmentsClass(String errorMessage,String hrefUrl,String docId,String docName)
        {
            this.errorMessage=errorMessage;
            this.hrefUrl=hrefUrl;
            this.docId=docId;
            this.docName=docName;
        }
    }
    public class emailTemplateClass
    {
        @AuraEnabled
        public string emailSubject {get;set;}
        @AuraEnabled
        public string emailBody {get;set;}
        public emailTemplateClass(String emailSubject,String emailBody)
        {
            this.emailSubject=emailSubject;
            this.emailBody=emailBody;
        }
    }
    /*---------FETCHING SESSION ID FOR LIGHTNING CALLOUTS------*/
    public static String fetchUserSessionId(){
        String sessionId = '';
        // Refer to the Page
        PageReference reportPage = Page.GetSessionIdFromVF;
        // Get the content of the VF page
        String vfContent = reportPage.getContent().toString();
        System.debug('vfContent '+vfContent);
        // Find the position of Start_Of_Session_Id and End_Of_Session_Id
        Integer startP = vfContent.indexOf('Start_Of_Session_Id') + 'Start_Of_Session_Id'.length(),
            endP = vfContent.indexOf('End_Of_Session_Id');
        // Get the Session Id
        sessionId = vfContent.substring(startP, endP);
        System.debug('sessionId '+sessionId);
        // Return Session Id
        return sessionId;
    }
    public static string erapidDocsBaseURL(String recordType)
    {
        String serverURL;
        ENV_SETTING__c URLSetting ;        
        if(recordType == 'CS Italy'){
        	URLSetting = ENV_SETTING__c.getValues('ITALY_SERVER');
        }
        if(URLSetting != null && URLSetting.Path__c != null){
            serverURL = URLSetting.Path__c;
            if(serverURL.endsWith('/')) {
                serverURL = serverURL.substring(0, serverURL.lastIndexOf('/'));
                system.debug('server url'+serverURL);
            }
        }
        return serverURL;
    }
    @AuraEnabled(cacheable=true)
    public static map<String,String> emailQuoteSetting(String productId, String fieldType, String quoteNo, String BUName)
    {
        system.debug('inside apex emailQuoteSetting');
        Map<String,String> dataMap = new Map<String,String>();
        //list<Email_Quote_Type__c> emailSettingsData = Email_Quote_Type__c.getAll().values();
        productId='%'+productId+'%';
        list<Email_Quote_Type__c> emailSettingsData=[SELECT id,Data_Order__C,label_name__c,URL__c 
                                                     FROM Email_Quote_Type__c 
                                                     WHERE Products__c 
                                                     LIKE:productId AND Field_Type__c=:fieldType AND BU_Name__c=:BUName
                                                     ORDER BY Data_Order__c ASC];
        for(Email_Quote_Type__c e:emailSettingsData)
        {
            //if(BUName==e.BU_Name__c && e.Products__c!=null && e.Products__c.contains(productId) && fieldType==e.Field_Type__c)
            //{
				dataMap.put(e.URL__c,e.Label_Name__c);                
            //}
        }
        system.debug('datamap='+datamap);
		return dataMap;
    }
    @AuraEnabled(cacheable=true)
    public static list<String> bccRecipientsList(String product, String BUName)
    {
        String productId = '%'+product+'%';
        list<String> recList = new list<String>();
        list<Email_Quote_Recipients_Default__c> emailSettingsData=[SELECT id,User_name__c,Email__c,User_Or_Contact_Id__c  
                                                     FROM Email_Quote_Recipients_Default__c 
                                                     WHERE Products__c 
                                                     LIKE:productId AND BU_Name__c=:BUName
                                                     ORDER BY Data_Order__c ASC];
        for(Email_Quote_Recipients_Default__c e: emailSettingsData)
        {
            recList.add(e.User_Or_Contact_Id__c );
        }
        return recList;
    }
}