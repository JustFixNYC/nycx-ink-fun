// This is based on: https://textit.in/flow/editor/c996fc46-4fcd-4181-a658-f688566c2577/

It sounds like your apartment needs repairs. First, tell us a little about who owns your apartment.

* NYCHA
  -> nycha
* Private landlord
  -> private_landlord
* I'm not sure
  -> predict_housing_type

== nycha ==

It looks like you live in public housing (aka NYCHA). To contact NYCHA directly about repairs, you can call the Customer Contact Center ("CCC") at 718-707-7771.

To learn more about requesting repairs from NYCHA, visit: https:\/\/www1.nyc.gov/site/nycha/residents/customer-contact-center-maint.page

We know NYCHA is not always responsive to tenants who need repairs. Would you like to hear more options about getting repairs in NYCHA? 

* Yes
  To write a letter of complaint to NYCHA that explains all your repair issues, you can use JustFix's Complaint Tool: https:\/\/app.justfix.nyc/en/loc. JustFix will send this letter to NYCHA via certified mail at no cost to you.

  We also understand that NYCHA does not always respond to letters from tenants. 

  Would you like to hear about more options to get repairs?

  ** Yes
     HP Actions are cases that tenants file against their landlord in housing court to obtain repairs or stop landlord harassment.  Want to learn about how to start an HP Action in housing court? 

     *** Yes
         ---- (how_to_file_hp) To file an HP Action, you can go to Manhattan Housing Court at 111 Centre Street, New York, NY 10013. The clerk can be reached at  646-386-5750. For more information on filing an HP Action, visit: http:\/\/www.courts.state.ny.us/courts/nyc/housing/startinghp.shtml
         -> end_repairs
     *** No
         Keep in mind that in NYCHA apartments, the City will only inspect an apartment or common area if a tenant starts an HP Action. 
         So, if you have already complained several times, an HP action may be your only option. Do you want to reconsider filing an HP Action?
         **** Yes
              -> nycha.how_to_file_hp
         **** No
              TODO: In the TextIt flow, we actually say "that's okay" and say some stuff about rent reduction here.
              -> end_repairs
  ** No
     -> end_repairs
* No
  -> end_repairs

== private_landlord ==

- (ask_if_rent_regulated) You selected private landlord!  Is your apartment rent-regulated?
* What does "rent-regulated" mean?
     Rent regulated includes rent-stabilized, rent controlled, project-based Section 8, HUD, Mitchell Lama.
     -> ask_if_rent_regulated
* Yes
  -- (rent_regulated) If you're ready to report your housing problems to the City, you can call 311.  The City should send an inspector from the New York City Department of Housing Preservation and Development ("HPD"). Do you want to learn more about an HPD inspection?
 ** Yes
    When you call 311, list EVERY bad condition in your apartment and the common areas of the building. An inspector should come within a week. If no inspector comes, just call again!
    Do you want to learn about how to find the results online after the inspection?
    *** Yes
        A few days after the inspector visits your apartment, housing code violations will be posted on the HPD website. Type your address into this website: https:\/\/www1.nyc.gov/site/hpd/about/hpd-online.page. Once your building information loads, look for the purple bar on the left side of the page and click, "all open violations."
        Are you ready to learn about other ways to get repairs?
        **** Yes
                -> loc
        **** No
                -> end_repairs
    *** No
        TODO: Implement this!
        -> end_repairs
  ** No
     TODO: Implement this!
     -> end_repairs
* No
  -- (non_rent_regulated) If you are not rent regulated, you may have fewer protections against eviction or large rent increases. While you can definitely use this TextBot to learn more about your right to get repairs today, you may want to speak with a lawyer before taking action. Before we go on, do you want to learn about speaking to a free housing lawyer?
  TODO: FINISH THIS
  -> end_repairs

== predict_housing_type ==

What is your address and borough (without your unit/apartment number)? Example: 654 Park Place, Brooklyn

>>> PREDICT_HOUSING_TYPE

* RENT_STABILIZED
  It's likely that you have a rent stabilized apartment. This means that you have extra protections against eviction and rent increases.
  -> private_landlord.rent_regulated
* NYCHA
  -> nycha
* MARKET_RATE
  It looks like you live in market rate (non rent-regulated) housing.
  -> private_landlord.non_rent_regulated
+ INVALID
  Hmm, that doesn't seem to be a valid address. Let's try again.
  -> predict_housing_type

== loc ==

If you're ready to take action against your landlord, you can use JustFix's letter of Complaint tool to write an official letter of complaint to your landlord by visiting: https:\/\/app.justfix.nyc/en/loc/splash. JustFix will handle the printing and send it certified mail free of charge!

Do you you want learn about other ways to get repairs? 

* Yes
  -> hpa
* No
  -> end_repairs

== hpa ==

You can also file a lawsuit in housing court against your landlord for failure to make repairs. This kind of case is called an HP Action. Would you like to learn more about an HP Action?

TODO: Finish this!

-> END

== end_repairs ==

Thanks for learning about repairs!

-> END
