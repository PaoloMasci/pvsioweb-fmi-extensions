CC=gcc
CFLAGS=-I.

%.o: %.c
	$(CC) -c -o $@ $< $(CFLAGS)
all:
	g++ -fPIC -Wall -c fmu.cpp
	g++ -fPIC -Wall -c LFRController.cpp
	g++ -shared -o LFRController.so LFRController.o fmu.o -lwebsockets -lssl -lcrypto
	mv LFRController.so binaries/linux64/
	zip -r LFRController.fmu modelDescription.xml binaries/ resources/

run:
	./fmuCheck.linux64 -h 1E-01 LFRController.fmu
run1:
	./fmuCheck.linux64 -h 1E-02 LFRController.fmu

clean:
	rm -rf LFRController.fmu LFRController.o fmu.o
