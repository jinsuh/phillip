# phillip
Hello, this is Phillip.

# !help
Shows the available list of commands.

# !test
Simple test command

# !stock {STOCK ABBREVIATION}
Information about a certain stock

# !event name (Mon | Tue | Wed | ...) ##:##(AM/PM) (ET/CT/MT/PT)
Schedules an event. I will ping the channel at that time.
Example commands:
- !event party Mon 2:42pm PT
- !event something 14:52pm CT
- !event ahhhhh 6:42 ET
You can remove the timezone if you've already set your preference via !timezone

# !join
Joins an event if one is scheduled.

# !leave
Leave an event if one is scheduled.

# !reminder
Shows information about a scheduled event.

# !remove
Removes a scheduled event if there is one.

# !reschedule (Mon | Tue | Wed | ...) ##:##(AM/PM) ET/CT/MT/PT
Cancels the previously scheduled event and reschedules it to a new time.

# !timezone ET/CT/MT/PT
Sets your preferred timezone.

## Deployment

Phillip is deployed on GCP using CloudBuild.

### Directory Structure

With the exception of `cloudbuild.yaml` all of the infrastructure related scripts live in the `infrastructure` directory. Here you'll find scripts to create Instance Groups and Instance Templates.

### CloudBuild

To initially setup the CloudBuild Container Registery, run this command:

```
gcloud builds submit --config cloudbuild.yaml
```

This will create the Container Registery to store docker images.

### Instance Templates

An instance template is a template describing instance size, docker image to deploy, etc.

A template can be created by modifying the `create-instance-template.sh`.

### Instance Groups

A instance group is an auto-scaling group of instances running the same docker image.

An instance group can be created by modifying the `create-instance-group.sh`.
