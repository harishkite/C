/*-------------------------------------------------------------*/
//this extension is for Lighting Quote UIs of International BUs
//We are implementing for CS Italy
/*------------------------------------------------------------*/
public class quoteLightningUtility {	
    /*--Filling Rep and Customer Info START------*/
    @AuraEnabled(cacheable=true)
    public static Quotes__c fillRepCustInfoInNewEditAlt(Quotes__c quote, String repId, String customerId)
    {
        Quotes__c qt = quote;        
        Map<Id,Contact> repCustInfo = repCustomerInformation(repId,customerId);
        qt.Account__c = repId.split('##')[0];
        qt.Contact__c = repId.split('##')[1];
        qt.Phone__c = repCustInfo.get(repId.split('##')[1]).Phone;
        qt.Fax__c = repCustInfo.get(repId.split('##')[1]).Fax;
        qt.Email__c = repCustInfo.get(repId.split('##')[1]).Email;
        qt.ADSrepNo__c = repCustInfo.get(repId.split('##')[1]).Contact_rep_no__c;
        
        qt.Account_Customer__c = customerId.split('##')[0];
        qt.Contact_customer__c = customerId.split('##')[1];
        qt.Phone_customer__c = repCustInfo.get(customerId.split('##')[1]).Phone;
        qt.Fax_Customer__c = repCustInfo.get(customerId.split('##')[1]).Fax;
        qt.Email_customer__c = repCustInfo.get(customerId.split('##')[1]).Email;
        /*--Filling Rep Customer Info START---*/
        system.debug('quote1=='+qt);
        //insert q;
        return qt;
    }    
    @AuraEnabled
    public static list<Quotes__c> fillRepCustInfoInCopy(list<multiQuoteClass> multiquotelist, Quotes__c basequote,String operation)
    {
        list<String> conIds = new list<String>();
        list<Quotes__c> quoteList = new list<Quotes__c>();
        system.debug('fillRepCustInfoInCopy');
        for(multiQuoteClass multiQuote:multiquotelist)
        {
            String selectedRep = multiQuote.repid;
            String selectedCustomer = multiQuote.customerid;
            if(selectedRep!=null && selectedRep.split('##')[1]!=null && selectedCustomer!=null && selectedCustomer.split('##')[1]!=null)
            {
                conIds.add(selectedRep.split('##')[1]);
                conIds.add(selectedCustomer.split('##')[1]);
            }
        }
        system.debug('conIds=='+conIds);
        map<Id,Contact> conDetailsMap = contactDetailsOfRepandCustomer(conIds);
        system.debug('conDetailsMap=='+conDetailsMap);
        if(conDetailsMap!=null && !conDetailsMap.isEmpty())
        {
            for(multiQuoteClass s:multiquotelist)
            {
                system.debug('s=='+s);
                Quotes__c qt = new Quotes__c();
                qt = basequote.clone();//qt is from LWC JS and cloning here
                qt.Account_Customer__c=s.customerId!=null && s.customerId.split('##')[0]!=null && s.customerId.split('##')[0]!='null' ?  s.customerId.split('##')[0]:null;
                qt.Account__c = s.repId!=null && s.repId.split('##')[0]!=null && s.repId.split('##')[0]!='null'?s.repId.split('##')[0]:null;
                boolean custIdInString = !conDetailsMap.isEmpty() && s.customerId!=null && s.customerId.split('##')[1]!=null && s.customerId.split('##')[1]!='null' && conDetailsMap.containsKey(s.customerId.split('##')[1])?true:false;                     
                boolean repIdInString = !conDetailsMap.isEmpty() && s.repId!=null && s.repId.split('##')[1]!=null && s.repId.split('##')[1]!='null' && conDetailsMap.containsKey(s.repId.split('##')[1])?true:false;                     
                //Rep Info Mapping START
                qt.contact__c=repIdInString?conDetailsMap.get(s.repId.split('##')[1]).Id:null;
                qt.Phone__c=repIdInString?conDetailsMap.get(s.repId.split('##')[1]).Phone:null;
                qt.Fax__c=repIdInString?conDetailsMap.get(s.repId.split('##')[1]).Fax:null;
                qt.Email__c=repIdInString?conDetailsMap.get(s.repId.split('##')[1]).Email:null;
                qt.ADSrepNo__c=repIdInString?conDetailsMap.get(s.repId.split('##')[1]).Contact_rep_no__c:null;//TAC#79524 Fix Remove Contact Rep No and Added Account.Rep_agent_no__c
                //Rep Info Mapping END`
                //Customer Info Mapping START
                qt.Contact_customer__c=custIdInString?conDetailsMap.get(s.customerId.split('##')[1]).Id:null;
                qt.Phone_customer__c=custIdInString?conDetailsMap.get(s.customerId.split('##')[1]).Phone:null;
                qt.Fax_Customer__c=custIdInString?conDetailsMap.get(s.customerId.split('##')[1]).Fax:null;
                qt.Email_customer__c=custIdInString?conDetailsMap.get(s.customerId.split('##')[1]).Email:null;
                qt.Alt_Doc_No__c=null;
            	quoteList.add(qt);
            }            
        }        
        return quoteList;   
    }
    @AuraEnabled
    public static map<id,Contact> contactDetailsOfRepandCustomer(list<String> conIds)
    {
        return new map<id,Contact>([SELECT id,Name,Phone,Email,Fax,AccountId,Contact_rep_no__c,Account.Rep_agent_no__c FROM Contact WHERE id in:conIds]);    
    }
    /*--Filling Rep and Customer Info END------*/
    @AuraEnabled//(cacheable=true) - Removed cacheable true where we got issue with Too Many DML statements: 1
    public static Quotes__c populateQuoteFields(String quote,String repId, String customerId, String operation, String erapidquotenumber)
    {
        System.debug('quote=='+quote);
        System.debug('repId=='+repId+'==customerId=='+customerId+'===operation=='+operation+'=erapidquotenumber='+erapidquotenumber);
        Quotes__c qt = (Quotes__c)JSON.deserialize(quote, Quotes__c.Class);        
        /*--Filling Rep Customer Info START---*/                        
        qt = fillRepCustInfoInNewEditAlt(qt,repId,customerId);
        
        if(operation!=null && operation=='Alternate' && erapidquotenumber!=null && erapidquotenumber!='' && erapidquotenumber!='undefined')
        {
            system.debug('in alternate IF='+erapidquotenumber);
            qt.Alt_Doc_No__c = erapidquotenumber;
        }
        system.debug('return qt=='+qt);
        return qt;
    }
    //repCustomerPicklistEntry method to fill Rep and Customer picklist
    @AuraEnabled
    public static list<String> multiQuoteCreation(String repcustdata,String quote)
    {
        //list<multiquoteclass> multiQuoteList = new list<multiquoteclass>();
        system.debug('repcustdata=='+repcustdata+'==quote=='+quote);               
        String operation = 'Copy';
        Quotes__c qt = (Quotes__c)JSON.deserialize(quote, Quotes__c.Class);        
        list<multiquoteclass> multiQuoteList = (list<multiquoteclass>)JSON.deserialize(repcustdata, list<multiquoteclass>.class);
        list<Quotes__c> quoteList = fillRepCustInfoInCopy(multiquotelist,qt,operation);
        system.debug('quoteList=='+quoteList.size()+'=='+quoteList);
        list<String> copyIds = new list<String>();
        try
        {
        	Insert quoteList;
            for(Quotes__c q:quoteList)
            {
				copyIds.add(q.id);
            }
        	return copyIds;    
        }
        catch(DMLException e)
        {
            system.debug('=exception='+e);
            return new list<String>{e.getDmlMessage(0)};
        }
    }
    @AuraEnabled
    public static string callErapidWebServiceMultiple(list<String> copyids,String operation)
    {
        list<ID> copyQuoteIds = new list<ID>();
        system.debug('copyids=='+copyids);   
        system.debug('copyQuoteIds=='+copyQuoteIds);
        String response = WebServiceCallNew1.ErapidListQuoteCall(copyids, 'Copy');
     	return response;
    }
    @AuraEnabled
    public static string callErapidWebService(String quoteId,String operation)
    {
        system.debug('callErapidWebService=='+quoteId+'==operation=='+operation);
        String calloutResult = '';
        if(Operation!=null && ( operation=='New' || operation=='Alternate' || operation=='Copy' ))
        {
            calloutResult = Webservicecallnew1.ErapidQuoteCall('', quoteID, operation);               
        }
        if(Operation!=null && operation=='Edit')
        {
            Quotes__c quoteRecord = [SELECT id,Erapid_Quote_no__c,C_S_Opportunity__r.RecordType.Name from Quotes__c Where Id=:quoteId];
            WebServiceCallNew1.ValidateDocHeader_Trigger('',quoteId,'EDIT',quoteRecord.Erapid_Quote_no__c,quoteRecord.C_S_Opportunity__r.RecordType.Name);    
            calloutResult='success';
        }        
        system.debug('calloutResult--->'+calloutResult);
        return calloutResult;
    }
    @AuraEnabled(cacheable=true)
    public static list<repCustomerPicklistClass> repCustomerPicklistEntry(String csOppId)
    {
        list<repCustomerPicklistClass> repCustomerLists = new list<repCustomerPicklistClass>();
        set<String> oraDupeCheckSet = new set<String>();
        for(opp_related_accounts__c ora:[SELECT Id, Account__c,Account_Role__c, Account__r.Name, Contact__c, Contact__r.AccountId, Contact__r.Name, Contact__r.Fax,Contact__r.Email, Contact__r.Phone,Contact__r.Contact_Rep_No__c, Contact__r.Type__c 
                                         FROM opp_related_accounts__c 
                                         WHERE C_S_Opportunity__c =:csOppId])     
        {
            if(!oraDupeCheckSet.contains(ora.Account__c+'##'+ora.Contact__c+'##'+ora.Account_Role__c))
            {
                Boolean isRepRole = ora.Account_role__c.contains('Representative')?true:false;            
                String label = isRepRole?ora.Account__r.Name+' / '+(ora.Contact__c!=null?ora.Contact__r.Name:'')+' / '+(ora.Contact__r.Contact_Rep_No__c!=null?ora.Contact__r.Contact_Rep_No__c:''):ora.Account__r.Name+' / '+(ora.Contact__c!=null?ora.Contact__r.Name:'');
                repCustomerLists.add(new repCustomerPicklistClass(isRepRole,ora.Account__c+'##'+ora.Contact__c,label));
                oraDupeCheckSet.add(ora.Account__c+'##'+ora.Contact__c+'##'+ora.Account_Role__c);
            }
        }
        return repCustomerLists;
    }    
    @AuraEnabled
    public static map<Id,Contact> repCustomerInformation(String selectedRep,String selectedCustomer)
    {        
        list<string> conIds = new list<string>();
        map<id,Contact> conDetailsMap = new map<id,Contact>();
        if(selectedRep!=null && selectedRep.split('##')[1]!=null && selectedCustomer!=null && selectedCustomer.split('##')[1]!=null)
        {
            conIds.add(selectedRep.split('##')[1]);
            conIds.add(selectedCustomer.split('##')[1]);
        }
        if(!conIds.isEmpty())
        {
            //conDetailsMap =  new map<id,Contact>([SELECT id,Name,Phone,Email,Fax,AccountId,Contact_rep_no__c FROM Contact WHERE id in:conIds]);
            conDetailsMap = contactDetailsOfRepandCustomer(conIds);
        }
        return conDetailsMap;
    }
    
    /*---WRAPPER CLASS - for multiple quote creation through UI---*/
    public class multiquoteclass
    {
        @AuraEnabled public string key {get;set;}
        @AuraEnabled public string repid {get;set;}
        @AuraEnabled public string customerid {get;set;}
        public multiquoteclass(String key,String repid,String customerid)
        {
            this.repid=repid;
            this.customerid=customerid;              
        }        
    }
    /*---WRAPPER CLASS - for Rep and Customer Picklist data---*/
    public class repCustomerPicklistClass
    {
        @AuraEnabled public string picklistLabel {get;set;}
        @AuraEnabled public string picklistValue {get;set;}
        @AuraEnabled public boolean isRepRole {get;set;}
        public repCustomerPicklistClass(Boolean isRepRole,String picklistValue,String picklistLabel)
        {
            this.picklistLabel=picklistLabel;
            this.picklistValue=picklistValue;
            this.isRepRole=isRepRole;            
        }
    }
    /*--Get all quote fields Data--START---*/
    /** generated dynamic query for quote clone **/
    @AuraEnabled
    public static Quotes__c quoteAllFields(String quoteId){
        system.debug('quoteId=='+quoteId);
        Quotes__c qt = Database.query(genDynamicQuery(quoteId));
        return qt;        
    }
    @AuraEnabled
    public static string genDynamicQuery(String quoteId){
        if(quoteId != null) {
            String fieldSets = '';
            for (SObjectField field : Quotes__c.SObjectType.getDescribe().fields.getMap().values()) {
                fieldSets = fieldSets + field.getDescribe().getName() + ',';
            }
            
            if (fieldSets.length() > 0){
                fieldSets = fieldSets.subString(0,fieldSets.length()-1);
                String dynamicQuery = 'SELECT ' + fieldSets + ',C_S_Opportunity__r.Name,C_S_Opportunity__r.RecordType.Name, RecordType.Name,C_S_Opportunity__r.CS_Product_Added__c,account_customer__r.name,contact_customer__r.Email, contact_customer__r.name, Account__r.Name, Account__r.Rep_Agent_no__c,Account__r.Country__c,Contact__r.accountId, Contact__r.Name,Contact__r.Fax,Contact__r.Email,Contact__r.Phone FROM Quotes__c WHERE Id=:quoteId';
                System.debug('###' + dynamicQuery);
                return dynamicQuery;   }
        }
        return null;
    }
    /*-----Notes Section Implementation----START---*/
    @AuraEnabled(cacheable=true)
    public static list<quoteNotesClass> quoteNotesList(String notevalue,String profileName, String notetable, String productid, String FREgn)
    {
        system.debug('==in quoteNotesList==');
        list<quoteNotesClass> quoteNotes = new list<quoteNotesClass>();
        wwwLebhqSfxtCSgroupComQuotes11D2.QuoteNoteList quoteLineList = CSNotesExtract.getQuoteLineList(profileName, noteTable, productId, FREgn);
        //--Extracting Notes---//
        //system.debug('---quoteLineList---'+quoteLineList);
        if(quoteLineList!=null && quoteLineList.QuoteNote!=null){
            set<string> noteCodes=new set<string>();
            if(noteValue!=null && noteValue!='')
            {
                noteCodes.addAll(noteValue.split(','));
            }
            for(wwwLebhqSfxtCSgroupComQuotes11D2.QuoteNote quoteNote:quoteLineList.QuoteNote)
            {
                if(quoteNote.description!=null && quoteNote.description!='' && quoteNote.description!='.'){
                    system.debug('note details are ======'+quoteNote);
                    quoteNotes.add(new quoteNotesClass(noteCodes!=null && noteCodes.size()>0 && noteCodes.contains(quoteNote.code)?true:false,quoteNote.code, quoteNote.description, quoteNote.shortdescription, quoteNote.model));
                }  
            }
        }
        return quoteNotes;
    }
    public class quoteNotesClass
    {
        @AuraEnabled public boolean isselected{get;set;}
        @AuraEnabled public String code{get;set;}
        @AuraEnabled public String description{get;set;}
        @AuraEnabled public String shortdescription{get;set;}
        @AuraEnabled public String model{get;set;}
        public quoteNotesClass(boolean isselected, String code, String description, String shortdescription, String model)
        {
            this.isselected=isselected;
            this.code=code;
            this.description=description;
            this.shortdescription=shortdescription;
            this.model=model;
        }
    }
    /*-----Notes Section Implementation----END-----*/    
    @AuraEnabled
    public static string fetchQuoteLineItemsAPI(String erapidNo,String quoteId)
    {
        String returnval = WebServiceClassGetQLIT.InsertQuoLiItems(erapidNo,quoteId);
        return returnval;
    }
    @AuraEnabled
    public static User fetchLoggedInUser(String userid)
    {
        return [SELECT Id,Name,Profile.Name,Erapid_Id__c,Erapid_Rep_No__c FROM User WHERE Id=:userid];
    }
    
}