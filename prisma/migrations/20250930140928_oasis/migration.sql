-- CreateTable
CREATE TABLE "public"."Asset" (
    "assetID" TEXT NOT NULL,
    "txtStation" TEXT NOT NULL,
    "txtDesc" TEXT,
    "txtCode" TEXT NOT NULL,
    "txtMediaGroup" TEXT NOT NULL,
    "txtMediaSubGroup" TEXT NOT NULL,
    "kodetitik" TEXT,
    "lnkMockup" TEXT,
    "numvisualW" TEXT,
    "numvisualH" TEXT,
    "numvisualSQM" TEXT,
    "numsizeW" TEXT,
    "numsizeH" TEXT,
    "numsizeD" TEXT,
    "numsizeSQM" TEXT,
    "numweightmedia" TEXT,
    "numweightstructure" TEXT,
    "numpoweract" TEXT,
    "numpowerest" TEXT,
    "txtpixelpitch" TEXT,
    "txtnotes" TEXT,
    "stsActive" BOOLEAN NOT NULL,
    "lnkTemplate" TEXT,
    "txtlevel" TEXT,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("assetID")
);

-- CreateTable
CREATE TABLE "public"."Client" (
    "clientID" SERIAL NOT NULL,
    "txtClient" TEXT NOT NULL,
    "txtCompany" TEXT,
    "txtPhone" TEXT,
    "txtAddress" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("clientID")
);

-- CreateTable
CREATE TABLE "public"."RentDetail" (
    "rentid" SERIAL NOT NULL,
    "assetID" TEXT NOT NULL,
    "clientID" INTEGER NOT NULL,
    "datestart" TEXT NOT NULL,
    "dateend" TEXT NOT NULL,
    "txtsales" TEXT,
    "lnkreport" TEXT,
    "txtnotes" TEXT,

    CONSTRAINT "RentDetail_pkey" PRIMARY KEY ("rentid")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetID_key" ON "public"."Asset"("assetID");

-- CreateIndex
CREATE UNIQUE INDEX "Client_clientID_key" ON "public"."Client"("clientID");

-- CreateIndex
CREATE UNIQUE INDEX "RentDetail_rentid_key" ON "public"."RentDetail"("rentid");

-- AddForeignKey
ALTER TABLE "public"."RentDetail" ADD CONSTRAINT "RentDetail_assetID_fkey" FOREIGN KEY ("assetID") REFERENCES "public"."Asset"("assetID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RentDetail" ADD CONSTRAINT "RentDetail_clientID_fkey" FOREIGN KEY ("clientID") REFERENCES "public"."Client"("clientID") ON DELETE RESTRICT ON UPDATE CASCADE;
