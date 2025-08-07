import  Storage  from '@google-cloud/storage';

const GCS_BUCKET_NAME = 'limpeja-uploads';
const GCS_KEY_BASE64 = 'eyJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsICJwcm9qZWN0X2lkIjogInNlbWlvdGljLWFudmlsLTQ2MTYxMy1jMCIsICJwcml2YXRlX2tleV9pZCI6ICI5NDZkOWI2MzRiOTY0NzZkYTdkMTU1ZTc2ZWQwOTZmODQzZjk5ZmNmIiwgInByaXZhdGVfa2V5IjogIi0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXZnSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2d3Z2dTa0FnRUFBb0lCQVFDb0ZrcHNoVEpLVlFIc1xublRsYWt0MzJnTE91dE9mMXZteUh3UlZBdUhlNm1NNkIxcm5nUitId2tEOHVlMkhCdXBVMWhhVE9SK3dnK0wxd1xuZ09mdzQyR2xwaitRK2prdXFQWDFEOFN1T0c0aWk0WURLNkJEUGFxQ055cDNXUTVORnpXOEgvRmZRcGVkSWFxalxuMjdSU3RocnlEaFoxTzZWYjZUcTFNcnkwcmV4ZkRWVndXKzFvMDdqeUVudmdIVERjcE1vRVcxdUJmTVlEczFVZ1xuUVJEL0tXaGt1L2NZZmpQMm9RTURhMk5XL0ZCZFkzZTg1cUo4NnZ2bjZpZUFGdWpaUW1PL2R0V0tMNkxpTUNDT1xudG1zVkJQM0ZKcC9XOFRydnJPWkhVQ1E5dnhZMWlrLy9OSHBaR1JSRGNhS3pUb0xyQnlNWnZpUzJpZkpWZFJlUVxuc2Y3VHpCSDlBZ01CQUFFQ2dnRUFVRk51dDVPanA5K2psOGErL09qSXlCOVRQdjlYQnBvODFWZFJaNytBQUIwOFxuT3RJNXU5TytScTg0Y21jbUhXV2tIcExDWW8zK2F2ZFQyS3JSck0yTkFaT0VOeTFOSEY1RVJCdUgrMVllVThYblxuZ2laY0RTWXdFTkI2SzlUVVA4VUN1ZWR0K3Y4ZzQwZU9lNFhvRThyUTc3SUp5M1o0bkliRnRvZ0xwRENsai9wUlxubjVVWUk5WjJmL2NzUXlpUjJqQXJyeFRqb0x6SXNWWHd5Q1pYZ0haNzNRa0NXNUphcWJlRDl2S21USWVKcWdESlxuMVEvdFdGb1hic25ZRi82Nktadk1kZGRJT1hGSTc5bnRVcHhCbllZbkxKZlo1YkVGeWJBOXdMSmR2b29ESll4ZFxuTkZvR20zOXNPdWZBWDlsUFcrd0hFYmU0aGFrMG9qcVZzakNpL2dGTlpRS0JnUURjdTBOaGN0WXhsd2JYRzlaaVxudVF0THY5SWJpWU82cE1jK2NUV0pjRm9JaytYT1l1Wit0TzRPVVc0N01TTmgxamp6aVpPOVhsbFF1WG1HZUdrQzFcbkxsb2x4WkhQdFhiWlZpTVk1b3dtMFlhUHBwQVBaK2JxZ25aSy9FNTNBVFJpNWllTWlmTlhEcVQyQ3VDQXVNVDMrXG5sdFlGQVlPbGk1ZWtiQzFMSFE5NFJxdGJtYndLQmdRREM4YXpqenBJVVVmTlhNWFVhTjB4eVZPbDc4OEJ2c0ZBeFxuckdWS1lKNkIrb2h1QU54WHdSU1lweHpONmdQeEJsbGMyQTBWa3BSSmZPOWRzV2dJTWg3N2hFWUgzRDd4ZWNpQlxubVlWVXNCTjVQTnFuSkFFS2ZoM212VFE3S2JIWHBqQk1QdUpLUVZSS3R0ZzVsZGNDN3U0R20wc0F5NXVWb0Q2U1xuSS93dldhUmtVd0tCZ1FERUdDRWVPNVVLYlMrSWZwU1JFLzl6RmpDa2dpQmkrZXlBRHJjUEtKN3pxK0NtMzdvQlxucXQ4cUhUR2VxR0xVa2luNlFiTWptcEpDdDFwbHlORGZwUlExSmpZSm54NjhxZ2Q0SWFrMCt3L2duK2FwWWhjRlxuRTIzZjVCSVBaS09uYmRZNVYwblpEMHMwRER1YWplaVRlcEViMXRRZVI4c3FLV2g3cUkrTHVXV05SUUtCZ0U0TFxuTE5rQ3NZSDY3aEQwTENDc09WRWVEUHgzMjljOVhSL3RJcytaa3F4aGFPcHBnYk1CMnFHWFBXRUtZN3lPZU83VS9sTVxuY1dpS2h4MG9qRGVwTjJuWWp2aklpclRJNHRZUG1FcnlLQ093WGd0eVptTDFrZ2tlVm1BeXJQOW1nTkZCc2lKRVxuSnBudHI0NDl4ekMrb1JhR2l2cFFIMlhSSFpkNFVMUjIvWmVkTXFnTEFvR0JBSzdMNUp4RzF3b3NGZVpFRTJzK1xucjM0ejg3Nk9FZnlnVEt6ZFdhZHoxNGozemR2YzlQSGNOc09nTjBKaFM0SUFPRmVSZ09sNWN';

// A partir daqui, o código faz o teste.
const credentials = JSON.parse(Buffer.from(GCS_KEY_BASE64, 'base64').toString('utf-8'));

async function checkGcsConnection() {
  console.log(`Iniciando teste de conexão GCS...`);
  console.log(`Bucket: ${GCS_BUCKET_NAME}`);
  console.log(`Projeto na chave: ${credentials.project_id}`);
  console.log(`-----------------------------------`);

  try {
    const storage = new Storage({ credentials });
    const [files] = await storage.bucket(GCS_BUCKET_NAME).getFiles({
        prefix: 'provider-documents/',
    });

    console.log(`Sucesso! Conectado ao bucket '${GCS_BUCKET_NAME}'.`);
    if (files.length > 0) {
      console.log('Arquivos encontrados na pasta provider-documents/:');
      files.forEach(file => {
          if (file.name !== 'provider-documents/') {
              console.log(`- ${file.name}`);
          }
      });
    } else {
      console.log('Nenhum arquivo encontrado na pasta provider-documents/.');
    }

  } catch (error) {
    console.error(`Erro ao conectar ao GCS:`, error);
  }
}

checkGcsConnection();