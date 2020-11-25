public class quoteCreationOverride {
    @AuraEnabled(cacheable=true)
    public static String quotePageBasedOnUser() 
    {        
        User u = [Select id,name,profile.Name from User where Id=:Userinfo.getUserId()];
        return redirectQuotePage(u.profile.name);
    }
	@AuraEnabled(cacheable=true)
    public static User userDetails() 
    {
        system.debug('in ');
        return [Select id,name,profile.Name from User where Id=:Userinfo.getUserId()];
    }
    @AuraEnabled(cacheable=true)
    public static String redirectQuotePage(String profileName)
    {
        map<String,CS_Quote_Page_Navigation__c> navQuoteMap = CS_Quote_Page_Navigation__c.getAll();
        return navQuoteMap.get(profileName).Page_name__c;
    }
    @AuraEnabled(cacheable=true)
    public static Quotes__c quoteData(String quoteid)
    {
        return [SELECT Id,C_S_Opportunity__c,Project__c from Quotes__c where Id=:quoteid LIMIT 1];
    }
}