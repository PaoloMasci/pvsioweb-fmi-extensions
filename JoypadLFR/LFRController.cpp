/*
 * In this file there are the implementations
 * of the fuctions declared in myfmu.h
 * along with the data needed.
 *
 * Sleep functions are needed to avoid concurrent execution problems
 * 50000 has been found with empirical trials
 * */
#include "fmu.h"
#include <stdio.h>
#include <stdlib.h>
#include <string>
#include <unistd.h>
#include <signal.h>
#include <locale.h>
#include "libwebsockets.h"

#define TRUE    1
#define FALSE   0
#define SUCCESS 1
#define FAIL    0

/**
 * variables for the websocket (cfr. the pacemaker example)
 */
int port = 0;
int initial_port = 8084;
int websocket_open = FALSE;
struct lws_context* context;
enum lws_callback_reasons callback_reason;
void* callback_in;
struct lws* callback_wsi;
int force_exit = 0;
char lwssendstate[LWS_SEND_BUFFER_PRE_PADDING + LWS_SEND_BUFFER_POST_PADDING+128];
char lwssendvariables[LWS_SEND_BUFFER_PRE_PADDING + LWS_SEND_BUFFER_POST_PADDING+128];


/**
 * variables for pvsio communication
 */

const struct lconv* loc = localeconv();


char sendbuff[1000];
char state[2000];
char variables[2000];
char tempstate[2000];
char banner[20000];
char receivebuff[1000];
char r5[1000];
char r1[1000];
char r2[1000];
char r3[1000];
char r4[1000];
char r6[1000];
char r7[1000];
char r8[1000];
char r9[1000];
char r0[1000];
int ret;
int index_state;
int index_state1;
int index_state2;
int FtS[2]; 		// Father to Son
int StF[2];			// Son to Father
int pid_of_son;
int first = 0;
double lfLeftVal;
double lfRightVal;
double servoVal[2];

double temp1,temp2;
FILE* fd;
extern FmiBuffer fmiBuffer;

/**
 * functions for websocket copied from the pacemaker example
 */
void sighandler(int sig) { force_exit = 1; }

/**
 * this is the callback function where we handle messages received from a PVSio-web user interface prototype
 */
static int WebSocketCallback(struct lws* wsi, enum lws_callback_reasons reason, void* user, void* in, size_t len) {
    /* global vars */
    callback_reason = reason;
    callback_in = in;
    callback_wsi = wsi;

    /* Callback */
    switch (callback_reason) {
    case LWS_CALLBACK_ESTABLISHED:
        printf("LWS_CALLBACK_ESTABLISHED\n");
        printf("**********************************************\n");
        printf("***              (FMI Protocol)           ****\n");
        printf("**********************************************\n");
        break;
    case LWS_CALLBACK_CLOSED:
        printf("CLIENT DISCONNECTED!\n\n");
        break;
    case LWS_CALLBACK_RECEIVE:
        printf("LWS_CALLBACK_RECEIVE\n");
        printf("Received message: %s\n", (char*) in);
        sendToPVS((char*) in);
        strcpy(tempstate,state);
        memset(variables,0,2000); // clenas variables before reusing
	    sprintf(variables,"linear: %f\nangular: %f\nx: %f\ny: %f\n", fmiBuffer.realBuffer[6],fmiBuffer.realBuffer[7],fmiBuffer.realBuffer[8],fmiBuffer.realBuffer[9]);
		printf("%s\n",variables);
		strcat(tempstate,variables);
        memcpy(lwssendstate + LWS_SEND_BUFFER_PRE_PADDING, tempstate, strlen(tempstate) );
        lws_write(wsi,(unsigned char *)lwssendstate + LWS_SEND_BUFFER_PRE_PADDING,strlen(tempstate),LWS_WRITE_TEXT);

        break;
    case LWS_CALLBACK_HTTP:
        printf("LWS_CALLBACK_HTTP\n");
        break;
    case LWS_CALLBACK_LOCK_POLL:
        printf("LWS_CALLBACK_LOCK_POLL\n");
        break;
    case LWS_CALLBACK_ADD_POLL_FD:
        printf("LWS_CALLBACK_ADD_POLL_FD\n");
        break;
    case LWS_CALLBACK_UNLOCK_POLL:
        printf("LWS_CALLBACK_UNLOCK_POLL\n");
        break;
    case LWS_CALLBACK_PROTOCOL_INIT:
        printf("LWS_CALLBACK_PROTOCOL_INIT\n");
        break;
    case LWS_CALLBACK_GET_THREAD_ID:
        printf("TIMEOUT\n");
        printf("LWS_CALLBACK_GET_THREAD_ID\n");
        break;
    case LWS_CALLBACK_WSI_DESTROY:
        printf("Timeout Happened %i\n", callback_reason);
        break;
    default:
        printf("Unmanaged Callback Reason! %i\n", callback_reason);
        break;
    }
    return 0;
}

/* list of supported protocols and callbacks */
static struct lws_protocols protocols[] = {
    {
        "FMI",              /* name */
        WebSocketCallback,  /* callback */
        0,                  /* per_session_data_size */
        0,                  /* max frame size / rx buffer */
    },
    {
        NULL, NULL, 0, 0   /* End of list */
    }
};

/* create websocket context */
int open_websocket() {
    const char *interface = NULL; /* NULL means
                                     "all interfaces" */
    lwsl_notice("libwebsockets test server - "
                "(C) Copyright 2010-2013 Andy Green <andy@warmcat.com> - "
                "licensed under LGPL2.1\n");
    struct lws_context_creation_info info;
    memset(&info, 0, sizeof(info));
    info.port = port;
    info.iface = interface;
    info.protocols = protocols;
    info.ssl_cert_filepath = NULL;
    info.ssl_private_key_filepath = NULL;
    info.gid = -1;
    info.uid = -1;
    info.options = 0;

    context = lws_create_context(&info);  /* global var */

    if (context == NULL) {
        printf("libwebsocket init failed\n");
        return FALSE;
    }

    printf("open_websocket on port %i\n", port);
    return TRUE;
}

int WebsocketServer(/* input variables */
                const double Aget,
                const double Vget
                /* output variables */
                ) {
    printf("BLOCK STARTED\n");

    time_t rt;           /* real time */
    rt = time(0);

    /* Open Websocket */
    if (websocket_open == FALSE) {
        port = initial_port;
        websocket_open = open_websocket();
        if (websocket_open == FALSE) {
            initial_port++; /* change port so that a new port
                            can be tried at the next attempt */
        } else {
            printf("WEBSOCKET OPENED\n");
            signal(SIGINT, sighandler);   /* handle user interrupts */
        }
        printf("RETURNING PORT %i\n", port);
        return port;
    } else {
        int repeat = TRUE;
        while (repeat) {   /* iterate until connection established */
            if (!force_exit) {
                /* wait for incoming msg, up to 100 ms */
                lws_service(context, 100);
                repeat = FALSE;
            } else {
                close_websocket();
                repeat = FALSE;
            }
        } /* END while */
        printf("BLOCK END\n");
        return port;
    }
}

void close_websocket() {
    lws_context_destroy(context);
    websocket_open = FALSE;
    printf("close_websocket\n");
}

/*
 *
 *
 *
 * functions for the communication with pvsio*/

/**
 * /param location is the URL path of the directory where resources folder has been unzipped
 * in order to start the pvsio process
 * we need to know the path where the folder resources/
 * has been placed and we need to guarantee the permission of execution
 * The pvsio process is launched with the stdin and stdout redirected
 * on the FtS and FsT pipes
 * and the initial banner is removed from the read buffer
 * */
void initialize(const char* location) {
	char a[100];
	char b[100];
	char c[100];
	char e[100];
	char f[200];
	printf("%s\n",location);
	strcpy(a, location);
	strcat(a,"/");
	strcpy(b, location);
	strcat(b,"/");
	strcpy(c, location);
	strcat(c,"/");
	strcpy(e,c);
	strcat(c, "PVS6.0");
	strcat(a,"pvsio");
	strcat(b,"LFRController.pvs");
	strcpy(e,c);
	strcat(e,"/bin/relocate");
	// these istructions remove the "file://" part of the string
	////////////////////////////////////////////////////////
	char* as = a;
	char* bs = b;
	char* cs = c;
	char* ds = e;
	ds= ds+5;
	bs= bs+5;
	as= as+5;
	cs= cs+5;
	printf("%s\n",as);
	printf("%s\n",bs);
	/////////////////////////////////////////////////////////
	char *parmList1[] = {"/bin/chmod", "+x","-R", (char*)&location[5],NULL};



	lfLeftVal  = 0;
	lfRightVal = 0;
	servoVal[0]=servoVal[1]= 0.0;


	pipe(FtS);
    pipe(StF);

    pid_of_son=fork();
    if ( pid_of_son == 0){
			execvp("chmod", parmList1);
	}
	else{wait(NULL);}
	getcwd(f,sizeof(f));
	chdir((char*)&location[5]);
	chdir("PVS6.0/");
	system("./bin/relocate");

    sleep(1);
    chdir(f);
    pid_of_son = fork();
	if ( pid_of_son == 0) {
		// son
		close( 0 );			//
		dup( FtS[0] );		// chiudo lo stdin

		close( FtS[0] );	// e lo sostituisco con Fts[0]
		close( FtS[1] );	//

		close ( 1 );		//
		dup( StF[1] );		// chiudo lo stdout

		close( StF[1] );	// e lo sostituisco con StF[1]
		close( StF[0] );	//

		// il processo lanciato da execlp eredita
		// i pipe dal processo che l'ha lanciato
		execlp(as,"pvsio",cs , bs, NULL);
    }
    //father
	close(FtS[0]);	//	closes the unnecessary pipe extremity
	close(StF[1]);	//  closes the unnecessary pipe extremity

	sleep(1);
	read(StF[0], banner, sizeof(banner));		// removes the  banner
	fd=fdopen(StF[0], "r");
	setlocale(LC_ALL, "C");
	sprintf(sendbuff,"init_state;");
	write(FtS[1], sendbuff,strlen(sendbuff));
	fgets(r3, sizeof(r3),fd);
	//printf("%s\n", r3);
	ret = fread(state,1,183,fd); // 183 is the minimum possibile
	while(findVariable("<PVSio>",state) == -1){
		ret+= fread(&state[ret],1,1,fd);
	}
	//printf("%s\n",state);
	state[ret-8]='\0'; // removes PVSio prompt
	//printf("%s\n",state);
	index_state=findVariable("motorSpeed",state);
	index_state1= findVariable("left",&state[index_state]);
	index_state2= findVariable("right",&state[index_state]);
	convertStringtoDouble(index_state+index_state1,3);
	convertStringtoDouble(index_state+index_state2,4);


}
/*
 * This function sends a string to and receives the answer from pvsio
 * At this point of development the parsing of the string is hardcoded
 * TODO read the string format from a config file*/
void sendToPVS(const char* action) {
	fflush(fd);
	if(strcmp(action,"tick")==0) WebsocketServer(fmiBuffer.realBuffer[1],fmiBuffer.realBuffer[2]); // we want to check the websocket only during the doStep call and avoid doing it after receiving a message
	sprintf(sendbuff,"%s(",action);
	strcat(sendbuff,state);
	strcat(sendbuff,");");
	printf("%s\n",sendbuff);
	memset(state,0,2000); // cleans state before using it
	write(FtS[1], sendbuff,strlen(sendbuff));
	do{
		fgets(r3, sizeof(r3),fd);
		printf("%s\n", r3);
	}
	while((strcmp(" ==>\n",r3)!=0) && (strcmp("==>\n",r3)!=0)); //  ";;;;;GC:;;;;;finished"  followed by "==>" withput whitespace

	ret = fread(state,1,183,fd); // 183 is the minimum possibile
	while(findVariable("<PVSio>",state) == -1){
		ret+= fread(&state[ret],1,1,fd);

	}

	state[ret-8]='\0'; // removes PVSio prompt


	/**
	 * we need to change the output of the FMU according to the state
	 *
	 * **/
	index_state=findVariable("motorSpeed",state);
	index_state1= findVariable("left",&state[index_state]);
	index_state2= findVariable("right",&state[index_state]);
	convertStringtoDouble(index_state+index_state1,3);
	convertStringtoDouble(index_state+index_state2,4);

	/**
	 *
	 * we need to change the state according to the input of the FMU
	 *
	 * **/
	index_state=findVariable("lightSensors",state);
	index_state1= findVariable("left",&state[index_state]);
	convertDoubletoString(index_state+index_state1,1);

	index_state=findVariable("lightSensors",state);
	index_state2= findVariable("right",&state[index_state]);
	convertDoubletoString(index_state+index_state2,2);
}
/*
 * This function simply sends the exit command
 *  to pvsio in order to terminate it
 * */
void terminate(){
	sprintf(sendbuff,"exit;\n");
	write(FtS[1], sendbuff,strlen(sendbuff));
	close_websocket();
}

int findVariable(const char tosearch[], const char state[]){
	int tmp_index=0;
	int success=0;
	while(success != 1){
		if(strchr(&state[tmp_index],tosearch[0]) != NULL){
			tmp_index=strchr(&state[tmp_index],tosearch[0]) - state;
			for(int i = 1; i< strlen(tosearch);i++){
				if(state[tmp_index+i] == tosearch[i]){
					success = 1;
				}
				else{
					success=0;
					tmp_index++;
					break;
				}
			}
		}
		else return -1;
	}
	if(tmp_index == -1)return -1; // not found
	return tmp_index+(strlen(tosearch))+4; // tmp_index contiene l'inizio della stringa cercata, +strlen aggiunge la lunghezza della stringa e +4 aggiunge " := " e quindi restituiamo esattamente l'indice dove si trovail valore
}

void convertStringtoDouble(int state_index, int buffer_index){
	temp1=0;
	temp2=0;
	if(atof(&state[state_index]) == 0){
		fmiBuffer.realBuffer[buffer_index] = 0;
	}
	else{
		sscanf(&state[state_index],"%[^'/']/%s %*s",r1,r2);
		temp1=atof(r1);
		temp2=atof(r2);

		if(strlen(r1) > 5){
			fmiBuffer.realBuffer[buffer_index] =temp1;
		}
		else{
			if(temp2 != 0){
				fmiBuffer.realBuffer[buffer_index] =temp1/temp2;
			}
			else {
				fmiBuffer.realBuffer[buffer_index] =temp1;
			}
		}
	}
}

void convertDoubletoString(int state_index, int buffer_index){
	char temp[1000];
	char value[20];
	int offset;

	if(buffer_index == 1){
		offset=strchr(&state[state_index],',')-&state[state_index];
		strcpy(temp,&state[state_index+offset]);
	}
	else{
		offset=strchr(&state[state_index],' ')-&state[state_index];
		strcpy(temp,&state[state_index+offset]);
	}
	state[state_index-1]='\0';
	sprintf(value,"%f",fmiBuffer.realBuffer[buffer_index]);
	strcat(state, " ");
	strcat(state,value);
	strcat(state,temp);
}
