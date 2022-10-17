#!/usr/bin/env python3
import subprocess
import requests
import time 
import os
import smtplib as smtp, ssl, os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import typing
import threading, schedule

BUILD_RUNNING = threading.Event() 
CURRENTLY_BUILDING = threading.Event()

"""
env vars:
HUB_MAIL_USERNAME
HUB_MAIL_PASSWORD
DOCK_ENV
"""

ENV = os.environ["DOCK_ENV"]

class bcolors:
    YELLOW_IN = '\033[33m'
    YELLOW_OUT = '\033[43m' 
    RED_IN = '\033[31m'
    CYAN_IN = '\033[93m'
    RED_OUT = '\033[41m'
    OKGREEN = '\033[92m'
    CEND = '\033[0m'

def send_mail(msg):
    port = 465 # SSL
    email = os.environ['HUB_MAIL_USERNAME']
    password = os.environ['HUB_MAIL_PASSWORD']

    server = smtp.SMTP_SSL('smtp.gmail.com', port) 
    server.login(email, password)
    server.sendmail(email, "thehubaubg@gmail.com", msg.as_string())
    server.close()

    print(bcolors.OKGREEN + "An email has been sent!" + bcolors.CEND)

def start_docker_compose():
    # --abort-on-container-exit is not compatible with detached mode
    # therefore check up should be done with requests

    msg = MIMEMultipart('alternative')
    
    # STOP NEW BUILDS FROM STARTING
    # IF THERE IS A BUILD WHICH IS CURRENTLY STARTED
    if CURRENTLY_BUILDING.is_set():
        return

    CURRENTLY_BUILDING.set()
    
    errors = {}

    # if BUILD_RUNNING.is_set():
        # stop_docker_compose()
        # BUILD_RUNNING.clear()

    dc_start = subprocess.run(["sudo", "docker-compose", "up", "--build", "-d" ])
    if dc_start.returncode == 0:
        print()     
        
        time.sleep(10)
        print(bcolors.CYAN_IN + "BUILD HEALTH CHECK:" + bcolors.CEND)

        ###### WEB ######
        get_web = check_service_up("http://127.0.0.1:80", "WEB")

        # "connection reset by peer"
        print()
        time.sleep(10) 
    
        ###### API ######
        get_api = check_service_up("http://127.0.0.1:8000/api/validate", "API")
        
        print()
        if(get_web == 200 and get_api == 400):
            print(bcolors.OKGREEN + f"{ENV} BUILD SUCCESSFUL" + bcolors.CEND)
            BUILD_RUNNING.set()

            msg['Subject'] = f'{ENV}:SPA BUILD SUCCESSFUL'
            msg.attach(MIMEText('<h3>All services are working!</h3>', 'html'))
            send_mail(msg)
            
            # THIS SIGNIFIES THAT A NEW BUILD CAN BE STARTED IF THERE IS AN ERROR
            CURRENTLY_BUILDING.clear()

            # THIS INDICATES THAT THE BUILD HAS BEEN SUCCESSFUL
            BUILD_RUNNING.set()
            return

        else:
            # docker-compose keeps running when there is a failed container
            stop_docker_compose()
            errors['WEB'] = get_web
            errors['API'] = get_api

    
    print(bcolors.RED_IN + "BUILD FAILED" + bcolors.CEND)
    msg['Subject'] = f'{ENV}:SPA BUILD FAILED'
    msg.attach(MIMEText('<p>' + str(errors) + '</p>', 'html'))
    send_mail(msg)

    CURRENTLY_BUILDING.clear()

def stop_docker_compose():
    dc_stop = subprocess.run(["sudo", "docker-compose", "down"])
    BUILD_RUNNING.clear()

def check_service_up(url: str, service: str):

    msg = MIMEMultipart('alternative')
    msg['Subject'] = '{}:{} - SERVICE IS DOWN!'.format(ENV, service)
    
    web_request = None

    """
    This could be heavily restructured if there are more services to be checked
    As of now, the replicated code is not an issue - it's easy to read
    """
    print()
    print(bcolors.YELLOW_IN + "CHECKING SERVICE {}:{} ".format(ENV, service) + bcolors.CEND)
    if service == "WEB":
        try:
            web_request = requests.get(url)
        except Exception as e:
            msg.attach(MIMEText('<h3>{}: GET Request to {} failed with the following exception: </h3> </p> {}'.format(ENV, url, str(e)) + '</p>', 'html'))
            send_mail(msg)
            print(bcolors.RED_IN + "{}:{} IS DOWN - {}".format(ENV, service, str(url)) + bcolors.CEND)
            return e

        if web_request.status_code != 200:
            # send email that the website is down
            msg.attach(MIMEText('<h3>{}: GET Request to {} failed with status code {}'.format(ENV, url, str(web_request.status_code)) + '</h3>', 'html'))
            send_mail(msg)
            print(bcolors.RED_IN + "{}:{} IS DOWN - {}".format(ENV, service, str(url)) + bcolors.CEND)
            return web_request.status_code
    
    elif service == "API":
        
        # BEARER_TOKEN = None
        # try: 
            # api_env_file = open("./packages/api/.env", "r")
        # except Exception as e:
            # print(bcolors.RED_IN + "Problem reading .env!" + bcolors.CEND)
            # return e

        # for line in api_env_file.readlines():
            # if "AUTH_TOKEN" in line:
                # BEARER_TOKEN = line.replace("AUTH_TOKEN=", "").replace("\n", "").replace("\"", "")

        # if not BEARER_TOKEN:
            # print(bcolors.RED_IN + "BEARER IS NOT SET!" + bcolors.CEND)
            # return

        try:
            web_request = requests.post(url=url)
        except Exception as e:
            msg.attach(MIMEText('<h3>{}: POST Request to {} failed with the following exception: </h3> </p> {}'.format(ENV, url, str(e)) + '</p>', 'html'))
            send_mail(msg)
            print(bcolors.RED_IN + "{}:{} IS DOWN - {}".format(service, str(url)) + bcolors.CEND)
            return e

        if web_request.status_code != 400:
            # send email that the website is down
            msg.attach(MIMEText('<h3>{}: POST Request to {} failed with status code {}'.format(ENV, url, str(web_request.status_code)) + '</h3>', 'html'))
            send_mail(msg)
            print(bcolors.RED_IN + "{}:{} IS DOWN - {}".format(ENV, service, str(url)) + bcolors.CEND)
            return web_request.status_code

    
    print(bcolors.OKGREEN + "Nothing unusual!" + bcolors.CEND)

    # this is to be fixed
    # make sure it returns the correct response codes
    # and if web is 200 and api is 400 
    # continue as normal

    return web_request.status_code


""" definitions of cron jobs """
def cron_local_test():

    local_web = check_service_up("http://127.0.0.1:80", "WEB")
    local_api = check_service_up("http://127.0.0.1:8000/api/validate", "API")
    
    # force rebuild
    if local_web != 200 or local_api != 400:
        BUILD_RUNNING.clear()

def cron_prod_test():
    check_service_up("https://thehub-aubg.com", "WEB")
    check_service_up("https://thehub-aubg.com/api/validate", "API")

def cron_git_check_for_updates():
    # only >= 3.7
    remote_update = subprocess.run(['git', 'remote', 'update'], capture_output=True, text=True)
    if remote_update.returncode != 0:
        print("GIT REMOTE UPDATE FAILED: \n{}".format(remote_update.stdout))
        return

    print(remote_update.stdout)
    
    # only >= 3.7
    status_uno = subprocess.run(['git', 'status'], capture_output=True, text=True)
    if status_uno.returncode != 0:
        print("GIT STATE FAILED: \n{}".format(status_uno.stdout))
        return 

    if "Your branch is behind" in status_uno.stdout or "Your branch is ahead" in status_uno.stdout:
        print("BRANCH IS BEHIND!")
        # stop_docker_compose()
        pull_remote = subprocess.run(['git', 'pull'], capture_output=True, text=True)
        reset_local = subprocess.run(['git', 'reset', '--hard', 'origin/master'])
        
        print("STARTING BUILD")
        start_docker_compose()

def cron_self_healing():
    print("BUILD IS RUNNING: {}".format(str(BUILD_RUNNING.is_set())))
    if not BUILD_RUNNING.is_set() and not CURRENTLY_BUILDING.is_set():
        print(bcolors.RED_IN + "WILL TRY TO RECOVER BUILD!" + bcolors.CEND)
        start_docker_compose()


""" threading for cron jobs """
def run_thread(job):
    print("\nSTARTING CRON JOB - {}".format(job.__name__))
    thread=threading.Thread(target=job)
    thread.start()

schedule.every(5).minutes.do(run_thread, cron_local_test)
#schedule.every(5).minutes.do(run_thread, cron_prod_test)

schedule.every(30).seconds.do(run_thread, cron_self_healing)

schedule.every(60).seconds.do(run_thread, cron_git_check_for_updates)

start_docker_compose()

while True:
    schedule.run_pending()
    time.sleep(1)

"""
 BUILD IS GOING TO SELF HEAL ONLY IF THERE IS A CASE OF UNREACHABLE LOCAL SERVICES!

 e.g. If either WEB or API return something different than 200 when checked within the check_service_up
      function, a rebuild is going to be triggered:

      1. cron_local_test checks the services and if one of them is down, it changes the state of the shared variable BUILD_RUNNING
      2. cron_self_healing checks if BUILD_RUNNING is False and if it is, it invokes the docker_compose steps defined in the functions
"""
