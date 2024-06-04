import { stripe } from '@/lib/stripe'
import { ImageContainer, ProductContainer, ProductDetails } from '@/styles/pages/product'
import axios from 'axios'
import { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Stripe from 'stripe'

interface ProductProps {
  product: {
    id: string;
    name: string;
    imageUrl: string;
    price: string;
    description: string;
    defaultPriceId: string;
  }
}

export default function Product({product}: ProductProps) {
  const [isCreatingCheckoutSession, setIsCreatingCheckoutSession] = useState(false)

  // permite pegarmos o fallback para vermos se está em loading
  const { isFallback } = useRouter()

  if (isFallback) {
    return <p>...loading</p>
  }

  async function handleBuyProduct() {
    try {
      setIsCreatingCheckoutSession(true)
      const response = await axios.post('/api/checkout', {
        priceId: product.defaultPriceId
      })

      const { checkoutUrl } = response.data;

      // enviar o usuário para uma rota externa
      window.location.href = checkoutUrl
    } catch (err) {
      setIsCreatingCheckoutSession(false) //como o usuário será redicecionado podemos deixar o false somente caso aconteca algum erro
      alert('Falha ao redirecionar ao checkout!')
    }
  }

  return (
    <>
      <Head>  
        <title>{product.name} | Ignite-Shop</title>
      </Head>
      <ProductContainer>
        <ImageContainer>
          <Image src={product.imageUrl} width={520} height={480} alt='' />
        </ImageContainer>
        <ProductDetails>
          <h1>{product.name}</h1>
          <span>{product.price}</span>


          <p>{product.description}</p>

          <button onClick={handleBuyProduct} disabled={isCreatingCheckoutSession}>
            Comprar agora
          </button>
        </ProductDetails>
      </ProductContainer>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [
      {params: {id: 'prod_QE2Z1XwYwE5zRO'}}
    ],
    // Com o fallback true o next vai tentar buscar o id que informarmos e substituir pelo id que informarmos para gerar a página estática com base no id.
    fallback: true, //vai carregar nossa página sem a info do produto, possibilitando um estado de loading até que seja carregado.
  }
}

// com o params eu consigo pegar o id da rota. assim pegando o id do produto.
export const getStaticProps: GetStaticProps = async ({params}) => {

  const productId = String(params!.id)

  const product = await stripe.products.retrieve(productId, {
    expand: ['default_price'],
  })

  const price = product.default_price as Stripe.Price
 
  return{
    props: {
      product: {
        id: product.id,
        name: product.name,
        imageUrl: product.images[0],
        price: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(price.unit_amount! / 100),
        description: product.description,
        defaultPriceId: price.id!
      }
    },
    revalidate:  60 * 60 * 1, //recarrega a página a cada 1 hora
  }
}