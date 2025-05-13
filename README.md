# PSI-System

Undergraduate Graduation Thesis Project

### Abstract

With the development of Internet and the application of big data, privacy 
protection has become increasingly important. **Secure multi-party computation** has 
become an important topic for both academia and industry. 

Secure multi-party 
computation refers to the joint computation of a target function by multiple participants 
without a trusted third party and ensuring that no participant can infer any other 
participant's input data through the interactive data during the calculation. **Private Set 
Intersection (PSI)** calculation is a specific application problem in the field of secure 
multi-party computation, which calculates the intersection of sets for two or more users 
without revealing their data. 

This paper designs a PSI protocol based on the **Diffie-Hellman key exchange 
algorithm** and implements a privacy set intersection system that supports multi-party 
online calculation based on this protocol. The purpose of the system is to provide small 
merchants and other groups a privacy set intersection platform for customer 
information, which facilitates their search for common customers and provides 
personalized recommendations for goods and other needs. 

The system is structured with 
a browser frontend and a server backend. The frontend is developed using **React** and 
**Ant Design**, while the backend is built on the **Flask** framework and is divided into 
login/registration modules, room management modules, data encryption modules, and 
result parsing modules. 

