import * as k8s from "@pulumi/kubernetes";
import * as fs from "fs"
import * as path from "path"
import * as yaml from "js-yaml"
import * as tls from "@pulumi/tls"

const values: any = yaml.load(
    fs.readFileSync(
      path.resolve(__dirname, "./kong-values.yaml")
    ).toString()
  )

const kongChart = new k8s.helm.v3.Chart("nginx-ingress", {
    chart: "kong",
    version: "2.7.0",
    fetchOpts:{
        repo: "https://charts.konghq.com",
    },
    values
});

const service = new k8s.core.v1.Service("service", {
  spec: {
    type: "ExternalName",
    externalName: "0.0.0.0"
  }
})

new k8s.networking.v1.Ingress("ingress1", {
  metadata: { name: "ingress1" },
  spec: {
    ingressClassName: "kong",
    rules: [
      {
        host: "example1.com",
        http: {
          paths: [
            {path: "/v2", pathType: "Prefix", backend: {service: { name: service.metadata.name, port: { number: 80}}}}
          ]
        }
      }
    ],
    tls: [
      {
        hosts: [ "example1.com", "example2.com"],
        secretName: "secret1"
      }
    ]
  }
})

new k8s.networking.v1.Ingress("ingress2", {
  metadata: { name: "ingress2" },
  spec: {
    ingressClassName: "kong",
    rules: [
      {
        host: "example1.com",
        http: {
          paths: [
            {path: "/v1", pathType: "Prefix", backend: {service: { name: service.metadata.name, port: { number: 80 }}}}
          ]
        }
      }
    ],
    tls: [
      {
        hosts: [ "example1.com", "example2.com"],
        secretName: "secret2"
      }
    ]
  }
})


const tlsKey = new tls.PrivateKey("tls-key", {
  algorithm: "RSA",
  rsaBits: 2048
})

const tlsCert = new tls.SelfSignedCert("tls-cert", {
  subjects: [{ commonName: "example1.com,example2.com" }],
  keyAlgorithm: tlsKey.algorithm,
  privateKeyPem: tlsKey.privateKeyPem,
  isCaCertificate: true,
  validityPeriodHours: 87600,
  allowedUses: [
    "key_encipherment",
    "digital_signature",
    "cert_signing",
  ]
})

const date = (new Date(1,1,1,1,1,1,1)).toISOString()
const names = ["secret1", "secret2"]
names.map( name => new k8s.core.v1.Secret(name, {
  metadata: {
    name,
    creationTimestamp: date
  },
  type: "kubernetes.io/tls",
  stringData: {
    "tls.crt": tlsCert.certPem,
    "tls.key": tlsKey.privateKeyPem
  }
}))
