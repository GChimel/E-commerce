import { HomeContainer, ProductLink} from "@/styles/pages/home";
import Image from "next/image";
import Head  from "next/head";

import { useKeenSlider } from 'keen-slider/react'
import 'keen-slider/keen-slider.min.css'

import { stripe } from "@/lib/stripe";
import { GetStaticProps } from "next";
import Stripe from "stripe";

interface HomeProducts {
  products: {
    id: string;
    name: string;
    imageUrl: string;
    price: string;
  }[]
}

export default function Home({products}: HomeProducts) {
  const [sliderRef] = useKeenSlider({
    slides: {
      perView: 3,
      spacing: 48,
    }
  })

  return (
    <>
      <Head>  
        <title>Home | Ignite-Shop</title>
      </Head>
      <HomeContainer ref={sliderRef} className="keen-slider">
        
        {products.map(product => {
          return (
            <ProductLink href={`/product/${product.id}`} className="keen-slider__slide"  key={product.id} prefetch={false}>
                <Image 
                  src={product.imageUrl} 
                  width={520} 
                  height={480} 
                  alt=""
                  priority={true}
                  />
                <footer>
                  <strong>{product.name}</strong>
                  <span>{product.price}</span>
                </footer>
              </ProductLink>
          )
        }
      )}

      </HomeContainer>
    </>
  );
}

// Busca de API pelo lado do servidor (getStaticProps é executado no momento da build do projeto - SSG)
export const getStaticProps: GetStaticProps = async () => {
  const response = await stripe.products.list({
    expand: ['data.default_price']
  })
  
  const products = response.data.map(product => {
    const price = product.default_price as Stripe.Price

    return {
      id: product.id,
      name: product.name,
      imageUrl: product.images[0],
      price: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(price.unit_amount! / 100),
    }
  })

  return {
    props: {
      products
    },
    // Será gerada uma versão estatica dessa página e depois de 10s será criada uma nova versão dessa página a cada:
    revalidate: 60 * 60 * 2, //2 horas
  }
}